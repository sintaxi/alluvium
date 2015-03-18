var redis = require("redis")

exports.createClient = function(cfg){
  if (!cfg) cfg = {}

  var client = redis.createClient(cfg)

  return {
    write: new Function,
    read: new Function
  }

}