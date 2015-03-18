var redis = require("redis")
var pkg   = require("../package.json")

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

      var date  = new Date(data.timestamp || new Date().toJSON)


      /**
       * we want a time stamp in `2015-03-15` format
       */

      var day   = date.getDate()
      var month = date.getMonth() + 1 // we have to add 1 because JavaScript.
      var year  = date.getFullYear()
      var stamp = year + "-" + month + "-" + day


      callback(data)
    },


    /**
     * Read - returns historical data for date range.
     *
     * Args:
     *    @day String (eg. 2015-03-17)
     *
     * Options:
     *    @delta Integer (eg. 14)
     *
     */

    read: function(day, options, callback){
      callback({
        version: pkg.version
      })
    }

  }

}