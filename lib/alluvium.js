var redis   = require("redis")
var pkg     = require("../package.json")
var helpers = require("./helpers")
var moment  = require("moment")

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

      /**
       * converte timestampe to JS date
       * if date not present we assume now
       */

      var date = helpers.day(data.timestamp)


      /**
       * This system is write heavy so we must do this in one go.
       */

      var transaction = client.multi()



      /**
       * Statuses
       *
       *   sintaxi.com::2015-03-17::statuses {
       *     200: 5
       *     304: 21
       *     404: 1
       *   }
       *
       */

      if (data.status)
        transaction.zincrby([data.domain, date, "statuses"].join("::"), 1, data.status)


      /**
       * Visits
       *
       *   sintaxi.com::2015-03-17::visits {
       *     /foo: 87
       *     /bar: 23
       *     /baz: 42
       *   }
       *
       */

      if (data.path)
        transaction.zincrby([data.domain, date, "visits"].join("::"), 1, data.path)


      /**
       * Devices
       *
       *   sintaxi.com::2015-03-17::device {
       *     desktop: 84
       *     phone: 64
       *     tablet: 38
       *   }
       *
       */
      if (data.device)
        transaction.zincrby([data.domain, date, "devices"].join("::"), 1, data.device)


      /**
       * One call
       */

      transaction.exec(callback)

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
        transaction.zrevrange([domain, d, "general"].join("::"), 0, 20, "WITHSCORES")

        // User Agent
        transaction.zrevrange([domain, d, "uaDevice"  ].join("::"), 0, 8, "WITHSCORES")
        transaction.zrevrange([domain, d, "uaOS"      ].join("::"), 0, 8, "WITHSCORES")
        transaction.zrevrange([domain, d, "uaBrowser" ].join("::"), 0, 8, "WITHSCORES")

        // Top Successful Paths, Top Redirects, and Paths Not Found, 
        transaction.zrevrange([domain, d, "pSuccess"].join("::"),  0, (options.breadth || 15), "WITHSCORES")
        transaction.zrevrange([domain, d, "pRedirect"].join("::"), 0, (options.breadth || 15), "WITHSCORES")
        transaction.zrevrange([domain, d, "pNotFound"].join("::"), 0, (options.breadth || 15), "WITHSCORES")

        // Usage by File
        transaction.zrevrange([domain, d, "bwFile"].join("::"), 0, (options.breadth || 15), "WITHSCORES")

        transaction.zrevrange([domain, d, "sources"].join("::"), 0, (options.breadth || 15), "WITHSCORES")

      })

      var callCountPerDay = (transaction.queue.length - 1) / range.length
      var queue           = transaction.queue

      transaction.exec(function(err, replies){
        var db = {}

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
          "visits",
          "connAll",
          "connEn",
          "connUn",
          "connR2En",
          "connR2Un",
          "st200",
          "st404",
          "st301",
          "bwH",
          "bwB",
          "bwT"
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