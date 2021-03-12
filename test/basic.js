var fs          = require("fs")
var ndjson      = require("ndjson")
var should      = require("should")
var redis       = require("redis")
var redisClient = redis.createClient()
var alluvium    = require("../").createClient({
  redisClient: redisClient
})

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
    alluvium.read("sintaxi.com", { timestamp: "2015-03-18" }, function(data){
      data.should.have.property("version")
      data.should.have.property("range")
      done()
    })
  })

  after(function(done){
    redisClient.flushall(function(){
      done()
    })
  })

})