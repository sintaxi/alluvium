var redis = require("redis")

exports.createClient = function(cfg){
  if (!cfg) cfg = {}

  var client = redis.createClient(cfg)

  return {
    log: new Function
  }

}