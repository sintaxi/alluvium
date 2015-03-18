exports.date = function(timestamp){

  var date  = new Date(timestamp || new Date().toJSON())


  var day   = date.getDate()
  var month = date.getMonth() + 1  // b/c JS
  var year  = date.getFullYear()


  /**
   * we want a time stamp in `2015-03-17` format
   */

  return year + "-" + month + "-" + day
}