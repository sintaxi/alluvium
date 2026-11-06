
var day = exports.day = function(timestamp, offset){
  
  // normalize input
  var date  = new Date(timestamp || new Date())

  // apply offset
  date.setDate(date.getDate() + (offset || 0))

  // we want `2015-03-17` format
  return date.toJSON().split("T")[0]
}

exports.range = function(options){
  options          = options || {}
  var endDay       = options.endDay || day()
  var numberOfDays = options.numberOfDays || 14
  r = []
  for (var i = numberOfDays -1; i >= 0; i--) { r.push(day(endDay, - i)) }
  return r
}

// http://stackoverflow.com/questions/9260647/javascript-convert-array-to-object
exports.mapResults = function mapResults (fields, next) {

  // Return a closure for a multi.exec call
  return function (err, replies) {
      if(err)
          return next(err);

      // Call next with no error and the replies mapped to objects
      next(null, replies.map(mapFields));
  };

  function mapFields (reply) {
      var obj = {};
      for(var i = 0, len = fields.length; i < len; i++)
          obj[fields[i]] = reply[i];
      return obj;
  }

}

var arrayToObject = exports.arrayToObject = function(arr){
  var obj = {}

  arr.forEach(function(item, index){
    if (index % 2 === 1) obj[arr[index -1]] = parseInt(item)
  })

  return obj
}

exports.parseReplies = function(replies) {
  return replies.map(arrayToObject)
}


var rank = function(a, b){ a.total > b.total ? 1 : -1 }


/**
 * Merge - one domain's read() replies from every edge into one payload.
 *
 *   merge({ "sfo-12.surge.sh": reply, "jfk-03.surge.sh": reply }, locationMap)
 *
 * It never throws and never trusts a reply (2026-11-06): the old merge
 * started from the first edge's payload and added the rest onto it, so
 * an edge missing a stat the first one had - an old knob next to a new
 * one - was a TypeError, and slushi's uncaughtException handler took the
 * api worker with it. Series were also added by array index, so edges
 * answering different day ranges silently misaligned.
 *
 *   - a reply without a usable range and counters is dropped and named
 *   - series align on the range's date labels, not positions; the merged
 *     range is the one most edges answered (ties: the longest)
 *   - a stat or day an edge lacks counts as zero
 *   - `edges` says who was counted and who was dropped (and why), so a
 *     partial answer can say so instead of looking like less traffic
 *
 * Returns null when no reply is usable.
 */

// every counter read() fills in; merge guarantees them so normalize and
// the cli can rely on them
var GENERAL = ["tC", "tV", "tU", "cE", "cU", "cRe", "cRu", "bH", "bB", "bA", "xH", "xM", "dC", "dU"]

// the per-day tables read() returns for its most recent days
var DETAIL = ["uD", "uO", "uB", "pS", "pR", "pN", "bF", "rS", "rM"]

var DAY = /^\d{4}-\d{2}-\d{2}$/

var num = function(v){
  var n = Number(v)
  return isFinite(n) ? n : 0
}

var isObject = function(v){
  return !!v && typeof v === "object" && !Array.isArray(v)
}

// why a reply can't be merged, or null when it can
var unusable = function(reply){
  if (!isObject(reply)) return "not an object"
  if (reply.error) return "error: " + String(reply.error).slice(0, 60)
  if (!Array.isArray(reply.range) || !reply.range.length) return "no range"
  for (var i = 0; i < reply.range.length; i++){
    if (!DAY.test(reply.range[i])) return "bad range"
  }
  if (!isObject(reply.g)) return "no counters"
  return null
}

// the range most replies agree on; ties go to the longest, then the latest
var chooseRange = function(replies){
  var votes = {}
  replies.forEach(function(r){
    var key = r.range.join(",")
    votes[key] = votes[key] || { range: r.range, count: 0 }
    votes[key].count++
  })
  return Object.keys(votes).map(function(k){ return votes[k] }).sort(function(a, b){
    if (b.count !== a.count) return b.count - a.count
    if (b.range.length !== a.range.length) return b.range.length - a.range.length
    return a.range[a.range.length - 1] < b.range[b.range.length - 1] ? 1 : -1
  })[0].range
}

// one edge's { t, s } re-indexed onto the merged range
var align = function(stat, fromRange, toRange){
  var s = toRange.map(function(){ return 0 })
  if (!isObject(stat) || !Array.isArray(stat.s)) return s
  var at = {}
  fromRange.forEach(function(day, i){ at[day] = i })
  toRange.forEach(function(day, i){
    if (at.hasOwnProperty(day)) s[i] = num(stat.s[at[day]])
  })
  return s
}

var sum = function(arr){
  return arr.reduce(function(a, b){ return a + b }, 0)
}

exports.merge = function(payload, locationMap){
  try {
    locationMap = locationMap || {}

    var edges = { answered: [], dropped: {} }
    var usable = []

    Object.keys(isObject(payload) ? payload : {}).forEach(function(dc){
      var servername = dc.split(".")[0]
      var why = unusable(payload[dc])
      if (why) return edges.dropped[servername] = why
      edges.answered.push(servername)
      usable.push({ servername: servername, reply: payload[dc] })
    })

    if (!usable.length) return null

    var range  = chooseRange(usable.map(function(u){ return u.reply }))
    var recent = range.slice(-3)
    var first  = usable[0].reply

    var result = { domain: first.domain }
    if (first.version !== undefined) result.version = first.version
    result.range = range.slice()

    // counters: every stat any edge reported, plus the guaranteed ones
    var stats = {}
    GENERAL.forEach(function(stat){ stats[stat] = true })
    usable.forEach(function(u){
      Object.keys(u.reply.g).forEach(function(stat){ stats[stat] = true })
    })

    result.g = {}
    Object.keys(stats).forEach(function(stat){
      var s = range.map(function(){ return 0 })
      usable.forEach(function(u){
        align(u.reply.g[stat], u.reply.range, range).forEach(function(v, i){ s[i] += v })
      })
      result.g[stat] = { t: sum(s), s: s }
    })

    // per-day tables: summed per item, only for days in the merged range,
    // and the recent days always present (as read() returns them)
    var inRange = {}
    range.forEach(function(day){ inRange[day] = true })

    var tables = {}
    DETAIL.forEach(function(key){ tables[key] = true })
    usable.forEach(function(u){
      Object.keys(u.reply).forEach(function(key){
        if (key === "g" || key === "tCr") return
        if (isObject(u.reply[key])) tables[key] = true
      })
    })

    Object.keys(tables).forEach(function(key){
      var table = {}
      recent.forEach(function(day){ table[day] = {} })
      usable.forEach(function(u){
        var days = u.reply[key]
        if (!isObject(days)) return
        Object.keys(days).forEach(function(day){
          if (!inRange[day] || !isObject(days[day])) return
          table[day] = table[day] || {}
          Object.keys(days[day]).forEach(function(item){
            table[day][item] = (table[day][item] || 0) + num(days[day][item])
          })
        })
      })
      result[key] = table
    })

    // connections by edge, for the datacentres panel
    result.tCr = {}
    usable.forEach(function(u){
      var airportcode = u.servername.split("-")[0]
      var place = isObject(locationMap[airportcode]) ? locationMap[airportcode] : {}
      var s = align(u.reply.g.tC, u.reply.range, range)
      result.tCr[u.servername] = {
        t: sum(s),
        s: s,
        city: place.city || "Unknown",
        country: place.country || "Unknown"
      }
    })

    result.edges = edges
    return result
  } catch (e) {
    return null
  }
}


exports.normalize = function(analytics){

  // a merged payload is complete by construction, but normalize is also
  // handed one edge's raw read(): every counter the cli dereferences
  // (.t, .s) exists, as zeros, whatever arrived
  analytics = isObject(analytics) ? analytics : {}
  var range = Array.isArray(analytics.range) ? analytics.range : []
  var g = isObject(analytics.g) ? analytics.g : {}
  var counter = function(stat){
    var c = g[stat]
    if (isObject(c) && Array.isArray(c.s)) return c
    return { t: 0, s: range.map(function(){ return 0 }) }
  }

  //console.log(analytics)

  // Normalize General Data

  
  

  var encryption  = {}
  var bandwidth   = []
  
  var device      = {}
  var os          = {}
  var browser     = {}

  var source      = {}
  var load        = {}

  var success     = {}
  var fail        = {}
  var redirect    = {}
  
  

  // encryptionTitleTable = {
  //   "connEn": "HTTPS",
  //   "connUn": "HTTP",
  //   "connR2En": "HTTPS (forced)",
  //   "connR2Un": "HTTP (forced)",
  // }
  //console.log(analytics)
  // Object.keys(analytics.g || {}).forEach(function(key){
  //   if(key.indexOf("c") === 0){
  //     encryption[key] = analytics.g[key]
  //   } 
  // })

  // Object.keys(analytics.g["c"] || {}).forEach(function(key){
  //   device.push({
  //     name      : key,
  //     total     : analytics.uD[key]["t"],
  //     breakdown : analytics.uD[key]["s"]
  //   })
  // })

  var rank = (a, b) => (a.count < b.count) ? 1 : -1

  Object.keys(analytics.pS || {}).forEach(function(day){
    success[day] = []
    Object.keys(analytics.pS[day] || {}).forEach(function(path){
      success[day].push({
        name      : path,
        count     : analytics.pS[day][path]
      })
    })
    success[day] = success[day].sort(rank)
  })

  Object.keys(analytics.pN || {}).forEach(function(day){
    fail[day] = []
    Object.keys(analytics.pN[day] || {}).forEach(function(path){
      fail[day].push({
        name      : path,
        count     : analytics.pN[day][path]
      })
    })
    fail[day] = fail[day].sort(rank)
  })

  Object.keys(analytics.pR || {}).forEach(function(day){
    redirect[day] = []
    Object.keys(analytics.pR[day] || {}).forEach(function(path){
      redirect[day].push({
        name      : path,
        count     : analytics.pR[day][path]
      })
    })
    redirect[day] = redirect[day].sort(rank)
  })

  Object.keys(analytics.uD || {}).forEach(function(day){
    device[day] = []
    Object.keys(analytics.uD[day] || {}).forEach(function(path){
      device[day].push({
        name      : path,
        count     : analytics.uD[day][path]
      })
    })
    device[day] = device[day].sort(rank)
  })

  Object.keys(analytics.uO || {}).forEach(function(day){
    os[day] = []
    Object.keys(analytics.uO[day] || {}).forEach(function(path){
      os[day].push({
        name      : path,
        count     : analytics.uO[day][path]
      })
    })
    os[day] = os[day].sort(rank)
  })

  Object.keys(analytics.uB || {}).forEach(function(day){
    browser[day] = []
    Object.keys(analytics.uB[day] || {}).forEach(function(path){
      browser[day].push({
        name      : path,
        count     : analytics.uB[day][path]
      })
    })
    browser[day] = browser[day].sort(rank)
  })

  Object.keys(analytics.rS || {}).forEach(function(day){
    source[day] = []
    Object.keys(analytics.rS[day] || {}).forEach(function(path){
      source[day].push({
        name      : path,
        count     : analytics.rS[day][path]
      })
    })
    source[day] = source[day].sort(rank)
  })

  Object.keys(analytics.bF || {}).forEach(function(day){
    load[day] = []
    Object.keys(analytics.bF[day] || {}).forEach(function(path){
      load[day].push({
        name      : path,
        count     : analytics.bF[day][path]
      })
    })
    load[day] = load[day].sort(rank)
  })

  // Object.keys(analytics.tCr || {}).forEach(function(dc){
  //   datacenters[dc] = analytics["g"]["tC"]["t"]

  //   // datacenters[dc] = {
  //   //   connections: analytics.tCr[dc],
  //   //   percentage : analytics.tCr[dc] / analytics["g"]["tC"]["t"]
  //   // }

  //   Object.keys(analytics.bF[day] || {}).forEach(function(path){
  //     load[day].push({
  //       name      : path,
  //       count     : analytics.bF[day][path]
  //     })
  //   })
  //   load[day] = load[day].sort(rank)
  // })

  //status.sort(rank)
  //encryption.sort(rank)
  // Object.keys(source.sort(rank).forEach(function(){
  //   sourc
  // })

  //device.sort(rank)
  //os.sort(rank)
  //browser.sort(rank)
  //success.sort(rank)
  //fail.sort(rank)
  //redirect.sort(rank)
  //load.sort(rank)

  return {
    normalizedAt : new Date().toJSON(),
    version      : analytics.version,
    domain       : analytics.domain,
    range        : range,
    
    traffic: {
      connections : counter("tC"),
      visits      : counter("tV"),
      uniques     : counter("tU")
    },

    encryption: {
      cE: counter("cE"),
      cU: counter("cU"),
      cRe: counter("cRe"),
      cRu: counter("cRu")
    },

    bandwidth: {
      all: counter("bA"),
      body: counter("bB"),
      headers: counter("bH"),
    },

    cache: {
      hit: counter("xH"),
      miss: counter("xM")
    },

    source       : source,
    device       : device,
    os           : os,
    browser      : browser,
    success      : success,
    fail         : fail,
    redirect     : redirect,
    load         : load,
    datacenters  : analytics.tCr || {},
    edges        : analytics.edges
  }
}




























