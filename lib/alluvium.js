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

      transaction.hincrby([data.domain, date, "statuses"].join("::"), data.status, 1)


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

      transaction.hincrby([data.domain, date, "visits"].join("::"), data.path, 1)


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

      transaction.hincrby([data.domain, date, "devices"].join("::"), data.device, 1)


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

      transaction.hgetall([domain, date, "statuses"].join("::"))
      transaction.hgetall([domain, date, "visits"].join("::"))
      transaction.hgetall([domain, date, "devices"].join("::"))

      transaction.exec(function(err, reply){
        var payload = {
          version: pkg.version,
          range: []
        }
        callback(payload)
      })

    }

  }

}