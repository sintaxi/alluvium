
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

exports.merge = function(payload, datacenter){
  if (datacenter) return payload[datacenter]

  var dcs = Object.keys(payload || {})
  var result;
  
  dcs.forEach(function(dc){
    if (!result){
      result = payload[dc]
      return
    } else {
      var next = payload[dc]
      var keys = Object.keys(payload[dc])
      keys.forEach(function(key){
        if (typeof payload[dc][key] === 'string') return
        if (Array.isArray(payload[dc][key])) return

        var rankKeys = Object.keys(payload[dc][key])
        rankKeys.forEach(function(k){
          if (!result[key].hasOwnProperty(k)){
            result[key][k] = payload[dc][key][k]
          } else {
            result[key][k]["total"] += payload[dc][key][k]["total"]
            payload[dc][key][k]["breakdown"].forEach(function(count, index){
              result[key][k]["breakdown"][index] += count
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

  
  var status      = []
  var encryption  = []
  var bandwidth   = []
  var source      = []
  var device      = []
  var os          = []
  var browser     = []
  var success     = []
  var fail        = []
  var redirect    = []
  var load        = []
  

  encryptionTitleTable = {
    "connEn": "HTTPS",
    "connUn": "HTTP",
    "connR2En": "HTTPS (forced)",
    "connR2Un": "HTTP (forced)",
  }

  Object.keys(analytics.general).forEach(function(key){
    if(key.indexOf("st") === 0){
      status.push({
        code: key.replace("st", ""),
        total: analytics.general[key]["total"],
        breakdown: analytics.general[key]["breakdown"]
      })
    }

    if(key !== "connAll" && key.indexOf("conn") === 0){
      encryption.push({
        type: encryptionTitleTable[key],
        total: analytics.general[key]["total"],
        breakdown: analytics.general[key]["breakdown"]
      })
    }
  })

  Object.keys(analytics.sources || {}).forEach(function(key){
    source.push({
      name      : key,
      total     : analytics.sources[key]["total"],
      breakdown : analytics.sources[key]["breakdown"]
    })
  })

  Object.keys(analytics.uaDevice || {}).forEach(function(key){
    device.push({ 
      name      : key,
      total     : analytics.uaDevice[key]["total"],
      breakdown : analytics.uaDevice[key]["breakdown"]
    })
  })

  Object.keys(analytics.uaOS || {}).forEach(function(key){
    os.push({ 
      name      : key,
      total     : analytics.uaOS[key]["total"],
      breakdown : analytics.uaOS[key]["breakdown"]
    })
  })

  Object.keys(analytics.uaBrowser || {}).forEach(function(key){
    browser.push({ 
      name      : key,
      total     : analytics.uaBrowser[key]["total"],
      breakdown : analytics.uaBrowser[key]["breakdown"]
    })
  })

  Object.keys(analytics.pSuccess || {}).forEach(function(key){
    success.push({ 
      path      : key,
      total     : analytics.pSuccess[key]["total"],
      breakdown : analytics.pSuccess[key]["breakdown"]
    })
  })

  Object.keys(analytics.pNotFound || {}).forEach(function(key){
    fail.push({ 
      path      : key,
      total     : analytics.pNotFound[key]["total"],
      breakdown : analytics.pNotFound[key]["breakdown"]
    })
  })

  Object.keys(analytics.pRedirect || {}).forEach(function(key){
    redirect.push({ 
      path      : key,
      total     : analytics.pRedirect[key]["total"],
      breakdown : analytics.pRedirect[key]["breakdown"]
    })
  })

  Object.keys(analytics.bwFile || {}).forEach(function(key){
    load.push({ 
      path      : key,
      total     : analytics.bwFile[key]["total"],
      breakdown : analytics.bwFile[key]["breakdown"]
    })
  })

  var rank = (a, b) => (a.total < b.total) ? 1 : -1

  status.sort(rank)
  encryption.sort(rank)
  source.sort(rank)
  device.sort(rank)
  os.sort(rank)
  browser.sort(rank)
  success.sort(rank)
  fail.sort(rank)
  redirect.sort(rank)
  load.sort(rank)

  return {
    normalizedAt : new Date().toJSON(),
    version      : analytics.version,
    domain       : analytics.domain,
    range        : analytics.range,
    general: {
      connections : analytics.general.trC,
      visits      : analytics.general.trV,
      uniques     : analytics.general.trU,
      bandwidth   : analytics.general.bwT
    },
    status      : status,
    encryption  : encryption,
    source      : source,
    device      : device,
    os          : os,
    browser     : browser,
    success     : success,
    fail        : fail,
    redirect    : redirect,
    load        : load
  }
}




























