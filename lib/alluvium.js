var redis       = require("redis")
var pkg         = require("../package.json")
var helpers     = require("./helpers")
var UAParser    = require('ua-parser-js')
var mime        = require("mime")
var url         = require("url")

// redis keys

// Ints


/** 

                      PROJECT ANALYTICS

KEY                             TYPE     NOTES
=================================================================

// if user facing...
2015-03-17:sintaxi.com:v        Int      total views of user facing paths

// if user facing (& not 304)...
2015-03-17:sintaxi.com:u        Int      total uniques of user facing paths

------------------------------------------------------------------------------------
CONNECTION COUNTS (encrypted, unencrypted, redirect encrypted, redirect unencrypted)
------------------------------------------------------------------------------------

CONNECTION COUNTS BY ENCRYPTION
2015-03-17:sintaxi.com:general          ZSet      { connAll }                                 // every time
                                                  { connEn, connUn, connR2En, connR2Un }      // one of
                                                  { st200, st301, st304, st404 }              // one of
                                                  { bwH, bwB, bwT }
2015-03-17:sintaxi.com:usDevice         ZSet      { d, t, p, o }
2015-03-17:sintaxi.com:uaOS             ZSet
2015-03-17:sintaxi.com:uaBrowser        ZSet
2015-03-17:sintaxi.com:pSuccess         ZSet
2015-03-17:sintaxi.com:pRedirect        ZSet
2015-03-17:sintaxi.com:pNotFound        ZSet
2015-03-17:sintaxi.com:bwFile           ZSet

------------------------------------------------------------------------------------
BANDWIDTH BY FILE
------------------------------------------------------------------------------------

2015-03-17:sintaxi.com:bwfileSuccess

**/

exports.createClient = function(cfg){
  if (!cfg) cfg = {}

  var client = cfg.redisClient
  return {


    /**
     * Write - logs usage data.
     *
     * Arg: @data
     *
     */

    write: function(data, callback){

      if (!callback) callback = new Function

      if (!cfg.redisClient.connected){
        return callback(null)
      } 

      // we use contentType to determine if connection or visit
      data.contentType = data.contentType || mime.getType(data.path)


      // we use User Agent for Device, OS, and Browser
      if (data.ua && data.ua.indexOf("Deno") === 0){
        data.deno = data.ua.split("/")[1]
        data.browser = "Deno " + data.deno
      }


      var ua = new UAParser(data.ua).getResult()
      data.browser = data.browser || ua.browser.name ? (ua.browser.name + " " + ua.browser.major) : "Unknown"
      data.os      = data.os      || ua.os.name || "Unknown"
      data.device  = data.device  || ua.device.vendor ? (ua.device.vendor + " " + ua.device.type) : "Unknown"  
      

      /**
       * converte timestampe to JS date
       * if date not present we assume now
       */

      var date = helpers.day(data.timestamp)
      var expireInSeconds = 1440 * 60 * 31      // 31 days
      var pathsExpireInSeconds = 1440 * 60 * 2  // 2 days
      var iPexpireInSeconds = 1440 * 60 * 1     // 1 days


      /**
       * These writes are frequent so we want to do this in one go.
       */

      var transaction = client.multi()

      var generalKey  = [data.domain, date].join("::")


      /**
       * Connection
       *
       *   sintaxi.com::2015-03-17::general {
       *     trC: 5
       *   }
       *
       */       

      if (data){
        transaction.zincrby(generalKey, 1, "tC")
        transaction.expire(generalKey, expireInSeconds)
      }


      if (data.deno){
        transaction.zincrby(generalKey, 1, "dC")
        transaction.expire(generalKey, expireInSeconds)
      }
        


      /**
       * Connection Type
       *
       *   sintaxi.com::2015-03-17::general {
       *     connEn: 5
       *     connUn: 21
       *     connR2En: 1
       *     connR2Un: 1
       *   }
       *
       */     

      if (data.encryption){
        var encyptionMap = {
          connEn: "E",
          connUn: "U",
          connR2En: "Re",
          connR2Un: "Ru",
          E: "E",
          U: "U",
          Re: "Re",
          Ru: "Ru"
        }
        transaction.zincrby(generalKey, 1, encyptionMap[data.encryption])
      }


      /**
       * Statuses
       *
       *   sintaxi.com::2015-03-17::general {
       *     st200: 5
       *     st304: 21
       *     st404: 1
       *   }
       *
       */       

      // if (data.status)
      //   transaction.zincrby(generalKey, 1, "st" + data.status)


      /**
       * Cache
       *
       *   sintaxi.com::2015-03-17::general {
       *     cacheH: 51
       *     cacheM: 2
       *   }
       *
       */       

      if (data.cache){
        if (data.cache === "HIT")  transaction.zincrby(generalKey, 1, "xH")
        if (data.cache === "MISS") transaction.zincrby(generalKey, 1, "xM")
      }


      /**
       * Bandwidth
       *
       *   sintaxi.com::2015-03-17::general {
       *     bwT: 87
       *     bwH: 23
       *     bwB: 42
       *   }
       *
       */

      if (data.bwH)
        transaction.zincrby(generalKey, data.bwH, "bH")

      if (data.bwB)
        transaction.zincrby(generalKey, data.bwB, "bB")

      if (data.bwH && data.bwB)
        transaction.zincrby(generalKey, data.bwH + data.bwB, "bA")


      /**
       * Visits
       *
       *   sintaxi.com::2015-03-17::pSuccess {
       *     /foo: 87
       *     /bar: 23
       *     /baz: 42
       *   }
       *
       *   sintaxi.com::2015-03-17::pRedirect {
       *     /foo: 87
       *     /bar: 23
       *     /baz: 42
       *   }
       *
       *   sintaxi.com::2015-03-17::pNotFound {
       *     /foo: 87
       *     /bar: 23
       *     /baz: 42
       *   }
       *
       */

      // if (data)
      //   transaction.zincrby([data.domain, date, "general"].join("::"), 1, "visits")

      // human friendly
      if (data.status == 200){
        if (
          (["text/html; charset=UTF-8","text/html", 'application/octet-stream', "text/plain"].indexOf(data.contentType) !== -1)
          || data.contentType === null){
          transaction.zincrby(generalKey, 1, "tV")
          transaction.zincrby([data.domain, date, "pS"].join("::"), 1, data.path)
          transaction.expire([data.domain, date, "pS"].join("::"), pathsExpireInSeconds)
        }
      }


      if (["301", "302", "303", "307", "308"].indexOf(data.status.toString()) !== -1){
        // dont track protolol redirects
        if (["connR2En", "connR2Un"].indexOf(data.encryption) === -1){
          var key = [data.status, data.path]
          if (data.redirectTo) key.push(data.redirectTo)
          transaction.zincrby([data.domain, date, "pR"].join("::"), 1, key.join(" ")) 
          transaction.expire([data.domain, date, "pR"].join("::"), pathsExpireInSeconds) 
        }
      }
    

      if (data.status == 404){
        transaction.zincrby([data.domain, date, "pN"].join("::"), 1, data.path)
        transaction.expire([data.domain, date, "pN"].join("::"), pathsExpireInSeconds) 
      }



      /**
       * User Agent
       *
       *   sintaxi.com::2015-03-17::device {
       *     desktop: 84
       *     phone: 64
       *     tablet: 38
       *   }
       *
       *   sintaxi.com::2015-03-17::browser {
       *     Chrome: 84
       *     Firefox: 64
       *     Edge: 38
       *   }
       *
       *   sintaxi.com::2015-03-17::device {
       *     "Mac OS": 84
       *     "Windows 10": 64
       *     "Ubuntu": 38
       *   }
       *
       */

      if (data.device){
        if (data.device == "undefined undefined") data.device = "Unknown"
        transaction.zincrby([data.domain, date, "uD"].join("::"), 1, data.device)
        transaction.expire([data.domain, date, "devices"].join("::"), pathsExpireInSeconds) 
      }

      if (data.os){
        if (data.os == "undefined") data.os = "Unknown"
        transaction.zincrby([data.domain, date, "uO"].join("::"), 1, data.os)
        transaction.expire([data.domain, date, "uO"].join("::"), pathsExpireInSeconds)
      }

      if (data.browser){
        if (data.browser == "undefined undefined") data.browser = "Unknown"
        transaction.zincrby([data.domain, date, "uB"].join("::"), 1, data.browser)
        transaction.expire([data.domain, date, "uB"].join("::"), pathsExpireInSeconds)
      }
      


      /**
       * User Agent
       *
       *   sintaxi.com::2015-03-17::device {
       *     desktop: 84
       *     phone: 64
       *     tablet: 38
       *   }
       */

      if (data.filePath && data.bwB && data.bwB != 0){
        transaction.zincrby([data.domain, date, "bF"].join("::"), data.bwB, data.filePath)
        transaction.expire([data.domain, date, "bF"].join("::"), pathsExpireInSeconds)
      }


      /**
       * Referrer
       *
       *   sintaxi.com::2015-03-17::sources {
       *     google.com: 84
       *     phone: 64
       *     tablet: 38
       *   }
       */

      if (data.referrer){
        var ref       = url.parse(data.referrer)
        var cleanRef  = ref.hostname + ref.pathname
        if (ref.hostname === data.domain){
          transaction.zincrby([data.domain, date, "rM"].join("::"), 1, [data.status, data.path, cleanRef].join(" "))
          transaction.expire([data.domain, date, "rM"].join("::"), pathsExpireInSeconds)
        }else{
          transaction.zincrby([data.domain, date, "rS"].join("::"), 1, cleanRef)
          transaction.expire([data.domain, date, "rS"].join("::"), pathsExpireInSeconds)
        }
      }
        


      /**
       * IP (for calculating uniques)
       *
       *   sintaxi.com::2015-03-17::ips {...}
       *
       */       

      if (data.ip){
        transaction.sadd([data.domain, date, "ip"].join("::"), data.ip)
        transaction.expire([data.domain, date, "ip"].join("::"), iPexpireInSeconds)
      }

      if (data.deno && data.ip){
        transaction.sadd([data.domain, date, "dip"].join("::"), data.ip)
        transaction.expire([data.domain, date, "dip"].join("::"), iPexpireInSeconds)
      }


      /**
       * IP (for calculating uniques)
       *
       *   sintaxi.com::2015-03-17::ips {...}
       *
       */       

       // We filalize with some reads so that we can trip zsets that are getting out of control

      // if (data.ip){
      //   // get count of IPs to record Uniques
      //   transaction.scard([data.domain, date, "ips"].join("::"))
      // }

      

      // This is EXPENSIVE.
      // We make these calls so we can trim the values 
      // We do this because this could be an attack vector.

      var trimPass = (Math.floor((Math.random() * 100) + 1)) === 99

      if (trimPass){
        console.log("trimming ", data.domain)
        transaction.zcard([data.domain, date, "bF"].join("::"))
        transaction.zcard([data.domain, date, "rS"].join("::"))
        transaction.zcard([data.domain, date, "rM"].join("::"))
        transaction.zcard([data.domain, date, "uD"].join("::"))
        transaction.zcard([data.domain, date, "uO"].join("::"))
        transaction.zcard([data.domain, date, "uB"].join("::"))
        transaction.zcard([data.domain, date, "pS"].join("::"))
        transaction.zcard([data.domain, date, "pR"].join("::"))
        transaction.zcard([data.domain, date, "pN"].join("::"))  
      }
      

      // get count of IPs to record Uniques
      transaction.scard([data.domain, date, "dip"].join("::"))

      // get count of IPs to record Uniques
      transaction.scard([data.domain, date, "ip"].join("::"))


      /**
       * Mostly one call
       */

      transaction.exec(function(errors, replies){
        //if (!data.ip) return callback(errors, replies)

        var trans = client.multi()

        if (trimPass){
          trans.zpopmin([data.domain, date, "bF"].join("::"), replies[replies.length - 11] - 110)
          trans.zpopmin([data.domain, date, "rS"].join("::"), replies[replies.length - 10] - 55)
          trans.zpopmin([data.domain, date, "rM"].join("::"), replies[replies.length - 9] - 220)
          trans.zpopmin([data.domain, date, "uD"].join("::"), replies[replies.length - 8] - 55)
          trans.zpopmin([data.domain, date, "uO"].join("::"), replies[replies.length - 7] - 55)
          trans.zpopmin([data.domain, date, "uB"].join("::"), replies[replies.length - 6] - 55)
          trans.zpopmin([data.domain, date, "pS"].join("::"), replies[replies.length - 5] - 55)
          trans.zpopmin([data.domain, date, "pR"].join("::"), replies[replies.length - 4] - 55)
          trans.zpopmin([data.domain, date, "pN"].join("::"), replies[replies.length - 3] - 55)
        }

        // inc deno uniques
        var denoUniques = replies[replies.length -2] || 1
        trans.zadd(generalKey, denoUniques, "dU")
        
        // inc traffic uniques
        var uniques = replies[replies.length -1] || 1
        trans.zadd(generalKey, uniques, "tU")

        

        // run second commmand
        trans.exec(function(){
          return callback(errors, replies)
        })

      })

    },


    /**
     * Read - returns historical data for date range.
     *
     * Args:
     *    @domain    String (eg. 2015-03-17)
     *    @timestamp String (eg. 2015-03-17)
     *
     * Options:
     *    @offset Integer (eg. 14)
     *
     * brainstorming...
     *
     *   paths: {
     *     "/foo" : 45
     *   }
     *
     *   paths: {
     *     "/foo": {
     *       visits: 255
     *       referrers: {
     *         "twitter.com/status/123" : 137,
     *         "google.com" : 48
     *       }
     *     }
     *     "/bar": {
     *       visits: 76
     *       referrers: {
     *         "twitter.com/status/456" : 33,
     *         "google.com" : 3
     *       }
     *     }
     *   }
     *
     */

    read: function(domain, options, callback){

      if(!callback){
        callback = options
        options  = {}
      }

      var endDay             = helpers.day(options["endDay"])
      var numberOfDays       = options["numberOfDays"] || 14
      var range              = helpers.range({ endDay: endDay, numberOfDays: numberOfDays })
      var today              = range[range.length -1]
      var yesterday          = range[range.length -2]
      var dayBeforeYesterday = range[range.length -3]
      var recentDays         = [today, yesterday, dayBeforeYesterday]

      var transaction = client.multi()
      
      range.forEach(function(day){
        transaction.zrevrange([domain, day].join("::"), 0, 14, "WITHSCORES")                              // General Counters
      })

      ;recentDays.forEach(function(day){
        transaction.zrevrange([domain, day, "uD"].join("::"), 0, 25, "WITHSCORES")                        // User-Agent (device)
        transaction.zrevrange([domain, day, "uO"].join("::"), 0, 25, "WITHSCORES")                        // User-Agent (os)
        transaction.zrevrange([domain, day, "uB"].join("::"), 0, 25, "WITHSCORES")                        // User-Agent (browser)
        transaction.zrevrange([domain, day, "pS"].join("::"), 0, (options.breadth || 30), "WITHSCORES")   // Path Counts (success)
        transaction.zrevrange([domain, day, "pR"].join("::"), 0, (options.breadth || 15), "WITHSCORES")   // Path Counts (redirect)
        transaction.zrevrange([domain, day, "pN"].join("::"), 0, (options.breadth || 15), "WITHSCORES")   // Path Counts (not-found)
        transaction.zrevrange([domain, day, "bF"].join("::"), 0, (options.breadth || 50), "WITHSCORES")   // Bandwidth by File
        transaction.zrevrange([domain, day, "rS"].join("::"), 0, (options.breadth || 30), "WITHSCORES")   // Referrer (source)
        transaction.zrevrange([domain, day, "rM"].join("::"), 0, (options.breadth || 99), "WITHSCORES")   // Referrer (map)
      })

      var callMap = [
        "uD",
        "uO",
        "uB",
        "pS",
        "pR",
        "pN",
        "bF",
        "rS",
        "rM"
      ]

      //var callCountPerDay = callMap.length

      transaction.exec(function(err, replies){
        var db = {}
        replies.forEach(function(reply, replyIndex){
          if (replyIndex < range.length){
            // we have a general sorted set that represents one day of data
            if (!db.hasOwnProperty("g")){ db["g"] = {} }

            reply.forEach(function(item, index){
              if (index % 2 === 1){
                var key = reply[index -1]
                var val = parseInt(item)
                
                // pre populate value zeros
                if (!db["g"].hasOwnProperty(key)) db["g"][key] = { t: 0, s: Array(range.length).fill(0) }

                // increment values
                db["g"][key]["t"] += val
                db["g"][key]["s"][replyIndex] = val
              }
            })

          }else{
            // replies that come after time series data
            var callCountPerDay = 9
            var afterCallsIndex = replyIndex - range.length
            var dayIndex        = Math.floor(afterCallsIndex / callCountPerDay)
            var dataTypeIndex   = afterCallsIndex % callCountPerDay
            var dataType        = callMap[dataTypeIndex]
            var day             = recentDays[dayIndex]
            //console.log(replyIndex, afterCallsIndex, dayIndex, dataTypeIndex, dataType, day)

            callMap.forEach(function(dataType){
              recentDays.forEach(function(day){
                if (!db.hasOwnProperty(dataType)) db[dataType] = {}
                if (!db[dataType].hasOwnProperty(day)) db[dataType][day] = {}
              })
            })

            //console.log(db)

            reply.forEach(function(item, index){
              if (index % 2 === 1){
                var key = reply[index -1]
                var val = parseInt(item)
                if (!db.hasOwnProperty(dataType)) db[dataType] = {}
                if (!db[dataType].hasOwnProperty(day)) db[dataType][day] = {}
                db[dataType][day][key] = val
                // // pre populate value zeros
                // if (!db["g"].hasOwnProperty(key)) db["g"][key] = { total: 0, breakdown: Array(range.length).fill(0) }

                // // increment values
                // db[dataType][day][key] = val
              }
            })
          }





          // var rangeIndex    = Math.floor(index / callCountPerDay)
          // var callType      = callMap[index % callCountPerDay]
          // var callDomain    = domain
          // var callDay       = range[rangeIndex]
          // var callProperty  = callType

          // // create the property if it doesnt exist
          // if (!db.hasOwnProperty(callType)){ db[callType] = {} }

          // // our sorted sets are returned to us in an Array.
          // reply.forEach(function(item, index){
          //   if (index % 2 === 1){
          //     var key = reply[index -1]
          //     var val = parseInt(item)
              
          //     if (!db[callProperty].hasOwnProperty(key)){
          //       db[callProperty][key] = {
          //         total: 0,
          //         breakdown: Array(range.length).fill(0)
          //       }
          //     } 

          //     db[callProperty][key]["total"] += val
          //     db[callProperty][key]["breakdown"][rangeIndex] = val
          //   }
          // })

        })

        // ensure defaults...

        ;[
          "tC",
          "tV",
          "tU",
          "cE",
          "cU",
          "cRe",
          "cRu",
          "bH",
          "bB",
          "bA",
          "xH",
          "xM",
          "dC",
          "dU",
        ].forEach(function(stat){
          if (!db["g"].hasOwnProperty(stat)){
            db["g"][stat] = {
              t: 0,
              s: Array(range.length).fill(0)
            }
          }
        })

        // prepare the payload for return
        var payload = { domain: domain, version: pkg.version, range: range }
        var keys    = Object.keys(db)
        keys.forEach(function(key){ payload[key] = db[key] })

        return callback(payload)
      })

    }

  }

}

exports.helpers = helpers
