var fs        = require("fs")
var alluvium  = require("../").createClient()
var ndjson    = require("ndjson")


describe("alluvium", function(){

  before(function(done){
    process.stdout.write(" ")
    fs.createReadStream(__dirname + '/input-data.ndjson')
    .pipe(ndjson.parse())
    .on('data', alluvium.log)
    .on('end', done)
  })

  it("should be cool", function(done){
    done()
  })

})