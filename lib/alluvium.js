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
        console.log(data)
        return callback(null)
      } 

      // we use contentType to determine if connection or visit
      data.contentType = data.contentType || mime.getType(data.path)


      // we use User Agent for Device, OS, and Browser
      var ua = new UAParser(data.ua).getResult()
      data.browser = data.browser || ua.browser.name ? (ua.browser.name + " " + ua.browser.major) : "Unknown"
      data.os      = data.os      || ua.os.name || "Unknown"
      data.device  = data.device  || ua.device.vendor ? (ua.device.vendor + " " + ua.device.type) : "Unknown"

      /**
       * converte timestampe to JS date
       * if date not present we assume now
       */

      var date = helpers.day(data.timestamp)


      /**
       * These writes are frequent so we want to do this in one go.
       */

      var transaction = client.multi()


      /**
       * Connection
       *
       *   sintaxi.com::2015-03-17::general {
       *     trC: 5
       *   }
       *
       */       

      if (data)
        transaction.zincrby([data.domain, date, "general"].join("::"), 1, "trC")


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

      if (data.encryption)
        transaction.zincrby([data.domain, date, "general"].join("::"), 1, data.encryption)


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

      if (data.status)
        transaction.zincrby([data.domain, date, "general"].join("::"), 1, "st" + data.status)


      /**
       * Cache
       *
       *   sintaxi.com::2015-03-17::general {
       *     cacheH: 51
       *     cacheM: 2
       *   }
       *
       */       

      if (data.cache)
        transaction.zincrby([data.domain, date, "general"].join("::"), 1, "cache" + data.cache)


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
        transaction.zincrby([data.domain, date, "general"].join("::"), data.bwH, "bwH")

      if (data.bwB)
        transaction.zincrby([data.domain, date, "general"].join("::"), data.bwB, "bwB")

      if (data.bwH && data.bwB)
        transaction.zincrby([data.domain, date, "general"].join("::"), data.bwH + data.bwB, "bwT")


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
          transaction.zincrby([data.domain, date, "general"].join("::"), 1, "trV")
          transaction.zincrby([data.domain, date, "pSuccess"].join("::"), 1, data.path)
          
        }
      }


      if (["301", "302", "303", "307", "308"].indexOf(data.status.toString()) !== -1){
        // dont track protolol redirects
        if (["connR2En", "connR2Un"].indexOf(data.encryption) === -1){
          var key = [data.status, data.path]
          if (data.redirectTo) key.push(data.redirectTo)
          transaction.zincrby([data.domain, date, "pRedirect"].join("::"), 1, key.join(" "))  
        }
      }
    

      if (data.status == 404)
        transaction.zincrby([data.domain, date, "pNotFound"].join("::"), 1, data.path)


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

      if (data.device)
        transaction.zincrby([data.domain, date, "devices"].join("::"), 1, data.device)

      if (data.browser)
        transaction.zincrby([data.domain, date, "browser"].join("::"), 1, data.browser)

      if (data.os)
        transaction.zincrby([data.domain, date, "os"].join("::"), 1, data.os)


      /**
       * User Agent
       *
       *   sintaxi.com::2015-03-17::device {
       *     desktop: 84
       *     phone: 64
       *     tablet: 38
       *   }
       */

      if (data.filePath && data.bwB && data.bwB != 0)
        transaction.zincrby([data.domain, date, "bwFile"].join("::"), data.bwB, data.filePath)


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
          transaction.zincrby([data.domain, date, "map"].join("::"), 1, [data.status, data.path, cleanRef].join(" "))
        }else{
          transaction.zincrby([data.domain, date, "sources"].join("::"), 1, cleanRef)
        }
      }
        


      /**
       * IP (for calculating uniques)
       *
       *   sintaxi.com::2015-03-17::ips {...}
       *
       */       

      if (data.ip)
        transaction.sadd([data.domain, date, "ips"].join("::"), data.ip)


      /**
       * IP (for calculating uniques)
       *
       *   sintaxi.com::2015-03-17::ips {...}
       *
       */       

      if (data.ip)
        transaction.scard([data.domain, date, "ips"].join("::"))


      /**
       * Mostly one call
       */

      transaction.exec(function(errors, replies){
        if (!data.ip) return callback(errors, replies)

        // we want to calculate the uniques so we can expire the list of ips sooner
        var uniques = replies[replies.length -1] || 1
        client.zadd([data.domain, date, "general"].join("::"), uniques, "trU", function(){
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

      var endDay        = helpers.day(options["endDay"])
      var numberOfDays  = options["numberOfDays"] || 14
      var range         = helpers.range({ endDay: endDay, numberOfDays: numberOfDays })

      var transaction = client.multi()

      range.forEach(function(d){

        // General Counters
        transaction.zrevrange([domain, d, "general"].join("::"), 0, 30, "WITHSCORES")

        // User Agent
        transaction.zrevrange([domain, d, "uaDevice"  ].join("::"), 0, 8, "WITHSCORES")
        transaction.zrevrange([domain, d, "uaOS"      ].join("::"), 0, 8, "WITHSCORES")
        transaction.zrevrange([domain, d, "uaBrowser" ].join("::"), 0, 8, "WITHSCORES")

        // Top Successful Paths, Top Redirects, and Paths Not Found, 
        transaction.zrevrange([domain, d, "pSuccess"].join("::"),  0, (options.breadth || 30), "WITHSCORES")
        transaction.zrevrange([domain, d, "pRedirect"].join("::"), 0, (options.breadth || 15), "WITHSCORES")
        transaction.zrevrange([domain, d, "pNotFound"].join("::"), 0, (options.breadth || 15), "WITHSCORES")

        // Usage by File
        transaction.zrevrange([domain, d, "bwFile"].join("::"), 0, (options.breadth || 50), "WITHSCORES")

        // referrer
        transaction.zrevrange([domain, d, "sources"].join("::"), 0, (options.breadth || 30), "WITHSCORES")

      })

      var queue           = transaction.queue
      var callCountPerDay = (queue.length - 1) / range.length
      

      transaction.exec(function(err, replies){
        var db = {}
        //console.log(transaction)
        replies.forEach(function(reply, index){

          var rangeIndex    = Math.floor(index / callCountPerDay)
          var callType      = queue[index + 1][0]
          var callKey       = queue[index + 1][1]
          var callKeyArr    = callKey.split("::")
          var callDomain    = callKeyArr[0]
          var callDay       = callKeyArr[0]
          var callProperty  = callKeyArr[2]

          //console.log(callDomain, callDay, callProperty)

          // create the property if it doesnt exist
          if (!db.hasOwnProperty(callProperty)){ db[callProperty] = {} }

          // our sorted sets are returned to us in an Array.
          reply.forEach(function(item, index){
            if (index % 2 === 1){
              var key = reply[index -1]
              var val = parseInt(item)
              
              if (!db[callProperty].hasOwnProperty(key)){
                db[callProperty][key] = {
                  total: 0,
                  breakdown: Array(range.length).fill(0)
                }
              } 

              db[callProperty][key]["total"] += val
              db[callProperty][key]["breakdown"][rangeIndex] = val
            }
          })
        })

        // ensure defaults...

        ;[
          "trC",
          "trV",
          "trU",
          "connEn",
          "connUn",
          "connR2En",
          "connR2Un",
          "st200",
          "st404",
          "st301",
          "bwH",
          "bwB",
          "bwT",
          "cacheHIT",
          "cacheMISS",
        ].forEach(function(stat){
          if (!db["general"].hasOwnProperty(stat)){
            db["general"][stat] = {
              total: 0,
              breakdown: Array(range.length).fill(0)
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