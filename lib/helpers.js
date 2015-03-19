exports.date = function(timestamp){

  var date  = new Date(timestamp || new Date().toJSON())


  var day   = ('0' + date.getDate()).slice(-2)
  var month = ('0' + (date.getMonth()+1)).slice(-2)  // b/c JS
  var year  = date.getFullYear()

  /**
   * we want a time stamp in `2015-03-17` format
   */

  return year + "-" + month + "-" + day
}

// http://stackoverflow.com/questions/9260647/javascript-convert-array-to-object
exports.mapResults = function mapResults (fields, next) {

  // Return a closure for a multi.exec call
  return function (err, replies) {
      if(err)
          return next(err);

      // Call next with no error and the replies mapped to objects
      next(null, replies.map(mapFields));
  };

  function mapFields (reply) {
      var obj = {};
      for(var i = 0, len = fields.length; i < len; i++)
          obj[fields[i]] = reply[i];
      return obj;
  }

}

var arrayToObject = exports.arrayToObject = function(arr){
  var obj = {}

  arr.forEach(function(item, index){
    if (index % 2 === 1) obj[arr[index -1]] = parseInt(item)
  })

  return obj
}

exports.parseReplies = function(replies) {
  return replies.map(arrayToObject)
}
