var fs        = require("fs")
var alluvium  = require("../").createClient()
var ndjson    = require("ndjson")
var should    = require("should")

describe("alluvium", function(){

  before(function(done){
    process.stdout.write(" ")
    fs.createReadStream(__filename + '.data')
    .pipe(ndjson.parse())
    .on('data', alluvium.write)
    .on('end', done)
  })

  it("exist", function(done){
    should.exist(alluvium)
    alluvium.should.have.property("write")
    alluvium.should.have.property("read")
    done()
  })

})