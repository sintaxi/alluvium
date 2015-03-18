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