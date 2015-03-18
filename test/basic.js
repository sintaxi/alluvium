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

  it("should exist", function(done){
    should.exist(alluvium)
    alluvium.should.have.property("write").and.be.a.Function
    alluvium.should.have.property("read").and.be.a.Function
    done()
  })

  it("should return version in payload", function(done){
    alluvium.read("sintaxi.com", function(data){
      data.should.have.property("version")
      data.should.have.property("range")
      done()
    })
  })

})