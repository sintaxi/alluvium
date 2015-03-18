var redis   = require("redis")
var pkg     = require("../package.json")
var helpers = require("./helpers")

exports.createClient = function(cfg){
  if (!cfg) cfg = {}

  var client = redis.createClient(cfg)

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

      var date = helpers.date(data.timestamp)


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

      var date   = helpers.date(options["timestamp"])
      var offset = options["offset"] || 7


      var transaction = client.multi()

      // fetch all statuses ranked highest to lowest.
      transaction.zrevrange([domain, date, "statuses"].join("::"), 0, 99, "WITHSCORES")

      // fetch 15 (by default) most popular paths ranked highest to lowest
      transaction.zrevrange([domain, date, "visits"].join("::"), 0, (options.breadth || 14), "WITHSCORES")

      // fetch all devices ranked highest to lowest
      transaction.zrevrange([domain, date, "devices"].join("::"), 0, 99, "WITHSCORES")

      transaction.exec(function(err, replies){
        var objectList = helpers.parseReplies(replies)

        var payload = {
          version: pkg.version,
          range: date,
          totals: {
            statuses: helpers.arrayToObject(replies[0]),
            visits: helpers.arrayToObject(replies[1]),
            devices: helpers.arrayToObject(replies[2])
          }
        }

        callback(payload)

      })

    }

  }

}