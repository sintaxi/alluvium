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
2015-03-17:sintaxi.com:cce      ZSet      { e, u, re, ru }

------------------------------------------------------------------------------------
USER AGENT CONNECTION COUNTS
------------------------------------------------------------------------------------

CONNECTION COUNTS BY DEVICE
2015-03-17:sintaxi.com:ccd      ZSet      { d, t, p, o }

CONNECTION COUNTS BY OS
2015-03-17:sintaxi.com:ccos     ZSet

CONNECTION COUNTS BY Browser
2015-03-17:sintaxi.com:ccb      ZSet

------------------------------------------------------------------------------------
VIEW COUNTS (success, fail, redirect, other)
------------------------------------------------------------------------------------

VIEW COUNT BY RESPONSE TYPE
2015-03-17:sintaxi.com:vc       ZSet     { s, f, r, o }

VIEW COUNT (PATH BREAKDOWN) BY RESPONSE TYPE [
2015-03-17:sintaxi.com:vcs      ZSet
2015-03-17:sintaxi.com:vcf      ZSet
2015-03-17:sintaxi.com:vcr      ZSet
2015-03-17:sintaxi.com:vco      ZSet
]

------------------------------------------------------------------------------------
BANDWIDTH COUNTS
------------------------------------------------------------------------------------

BW INCLUDING HEADERS [USED FOR BILLING]
2015-03-17:sintaxi.com:bwt      Int       {file}

BW COUNT (FILE BREAKDOWN) BY PATH - [USED FOR USAGE REPORTS]
2015-03-17:sintaxi.com:fbw      ZSet      {file}



                      PROJECT USAGE

KEY                             TYPE     NOTES
=================================================================

2015-03-17:sintaxi.com:h        Int      total hit
2015-03-17:sintaxi.com:bw       Int      total bandwidth
2015-03-17:sintaxi.com:hf       ZSet     total hit by filename
2015-03-17:sintaxi.com:bwf      ZSet     total bandwidth by filename

**/

// ----------------------------------------------

// - Indicates what platform should charge
// - Indicates what file to optimize

// Bandwidth (Int)
// 2015-03-17:sintaxi.com:bwt

// Bandwidth by File (ZSet)
// 2015-03-17:sintaxi.com:bwf

// ----------------------------------------------

// - Indicates what the platform should charge
// - Indicates what file to optimize

// Bandwidth by Platform (ZSet)
// 2015-03-17:surge.sh:bwp

// Bandwidth by ALL (ZSet)
// 2015-03-17:surge.sh:bwp


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

      var date_end  = helpers.day(options["timestamp"])
      var offset    = options["offset"] || 14
      var groups    = 3 // the number of redis calls per group

      var range = []
      for (var i = offset -1; i >= 0; i--) {
        range.push(helpers.day(moment(date_end).subtract(i, "days").format()))
      }

      var transaction = client.multi()

      range.forEach(function(d){

        // fetch all statuses ranked highest to lowest.
        transaction.zrevrange([domain, d, "statuses"].join("::"), 0, 11, "WITHSCORES")

        // fetch 15 (by default) most popular paths ranked highest to lowest
        transaction.zrevrange([domain, d, "visits"].join("::"), 0, (options.breadth || 9), "WITHSCORES")

        // fetch all devices ranked highest to lowest
        transaction.zrevrange([domain, d, "devices"].join("::"), 0, 11, "WITHSCORES")
      })

      transaction.exec(function(err, replies){
        var objectList = helpers.parseReplies(replies)
        var objects    = [{}, {}, {}]

        replies.forEach(function(reply, index){
          var groupIndex = index % groups // will return 0, 1, or 2
          var hash       = helpers.arrayToObject(reply)
          for (var prop in hash) {
            if (hash.hasOwnProperty(prop)) {
              if (!objects[groupIndex].hasOwnProperty(prop))
                objects[groupIndex][prop] = new Array(range.length)

              var arrIndex = Math.floor(index / 3)
              objects[groupIndex][prop][arrIndex] = (objects[groupIndex][prop][arrIndex] || 0) + hash[prop]
            }
            for( var i = 0; i < objects[groupIndex][prop].length; i++ ) {
             if( typeof(objects[groupIndex][prop][i])==="undefined" ) {
              objects[groupIndex][prop][i] = 0;
             }
            }
          }

        })

        var total = 0
        for (st in objects[0]) {
          objects[0][st].forEach(function(i){
            total += i
          })
        }


        var transaction = client.multi()
        var paths = {}

        for (p in objects[1]) {
          //transaction.zrevrange([domain, d, "statuses"].join("::"), 0, 11, "WITHSCORES")

          paths[p] = {
            //"referrers": {},
            //"statuses" : {},
            "total": 0,
            "breakdown": objects[1][p]
          }



          objects[1][p].forEach(function(i){
            paths[p]["total"] += i
          })
        }

        // TODO:
        // - encryption
        // - gross                (counter by files)
        // - net                  (counter to paths by total connections)
        // - uniques              (counter to paths by unique IP address)
        // - traffic              (paths by status code)
        // - referrals
        // - devices              (phone, tablet, desktop, other)
        // - content              (track file transfers)


        // TODO
        /*

          var payload = {
            
            domain: String,
            version: String,
            range: [],

            totalCons: [],
            encryptCons: [],
            unencryptCons: [],
            uniqueCons: [],

            traffic: {...},
            transfers: {...},
            referrals: {...},         ()
            devices: {...}            phone/tablet/desktop/other
          }

        */

        var payload = {
          domain: domain,
          version: pkg.version,
          range: range,
          total: total,
          paths: paths,
          statuses: objects[0],
          visits: objects[1],
          devices: objects[2]
        }

        callback(payload)
      })

    }

  }

}