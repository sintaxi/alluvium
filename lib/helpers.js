
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

exports.merge = function(payload, locationMap){
  locationMap = locationMap || {}

  var dcs = Object.keys(payload || {})
  var result;
  
  dcs.forEach(function(dc){
    var servername = dc.split(".")[0]
    var airportcode = servername.split("-")[0]
    if (!result){
      result = payload[dc]
      result.tCr = {}
      result.tCr[servername] = JSON.parse(JSON.stringify(payload[dc]["g"]["tC"]))
      result.tCr[servername]["city"]    = locationMap[airportcode] ? locationMap[airportcode]["city"]    : "Unknown"
      result.tCr[servername]["country"] = locationMap[airportcode] ? locationMap[airportcode]["country"] : "Unknown"
      return
    } else {
      var next = payload[dc]
      var keys = Object.keys(payload[dc])
      keys.forEach(function(key){
        if (typeof payload[dc][key] === 'string') return
        if (Array.isArray(payload[dc][key])) return
        var attrOrDateKeys = Object.keys(payload[dc][key])
        attrOrDateKeys.forEach(function(attrOrDay){
          if (attrOrDay.split("-").length === 3){
            Object.keys(payload[dc][key][attrOrDay]).forEach(function(item){
              result[key][attrOrDay][item] = (result[key][attrOrDay][item] || 0) + (payload[dc][key][attrOrDay][item] || 0)
            })
          } else {
            //console.log(dc, key, attrOrDay, result[key][attrOrDay])
            if (attrOrDay === "tC"){
              result.tCr[servername]            = JSON.parse(JSON.stringify(payload[dc]["g"]["tC"]))
              result.tCr[servername]["city"]    = locationMap[airportcode] ? locationMap[airportcode]["city"]    : "Unknown"
              result.tCr[servername]["country"] = locationMap[airportcode] ? locationMap[airportcode]["country"] : "Unknown"
            }
            result[key][attrOrDay]["t"] += payload[dc][key][attrOrDay]["t"]  
            payload[dc][key][attrOrDay]["s"].forEach(function(count, index){
              result[key][attrOrDay]["s"][index] += count
            })
          }
        })
      })
    }
  })

  return result
}


exports.normalize = function(analytics){

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
    range        : analytics.range,
    
    traffic: {
      connections : analytics.g.tC,
      visits      : analytics.g.tV,
      uniques     : analytics.g.tU
    },

    encryption: {
      cE: analytics.g["cE"] || 0,
      cU: analytics.g["cU"] || 0,
      cRe: analytics.g["cRe"] || 0,
      cRu: analytics.g["cRu"] || 0
    },

    bandwidth: {
      all: analytics.g.bA,
      body: analytics.g.bB,
      headers: analytics.g.bH,
    },

    cache: {
      hit: analytics.g.xH,
      miss: analytics.g.xM
    },

    source       : source,
    device       : device,
    os           : os,
    browser      : browser,
    success      : success,
    fail         : fail,
    redirect     : redirect,
    load         : load,
    datacenters  : analytics.tCr
  }
}




























