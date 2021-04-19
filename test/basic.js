var fs          = require("fs")
var ndjson      = require("ndjson")
var should      = require("should")

var redis       = require("redis")
var redisClient = redis.createClient()

var Alluvium    = require("../")
var alluvium    = Alluvium.createClient({ redisClient: redisClient })

describe("alluvium", function(){

  before(function(done){
    process.stdout.write(" ")
    fs.createReadStream(__filename + '.data')
    .pipe(ndjson.parse())
    .on('data', alluvium.write)
    .on('end', done)
  })

  it("should exist", function(done){
    should.exist(Alluvium)
    should.exist(alluvium)
    Alluvium.should.have.property("helpers")
    alluvium.should.have.property("write").and.be.a.Function
    alluvium.should.have.property("read").and.be.a.Function
    done()
  })

  it("should default to 14 days from current day", function(done){
    alluvium.read("sintaxi.com", {}, function(data){
      data.should.have.property("version")
      data.should.have.property("range")
      data.range.should.be.instanceof(Array).and.have.lengthOf(14);
      done()
    })
  })

  it("should return a range of 14 by default", function(done){
    alluvium.read("sintaxi.com", { endDay: "2015-03-18"}, function(data){
      data.should.have.property("version")
      data.should.have.property("range")
      data.range.should.be.instanceof(Array).and.have.lengthOf(14);
      done()
    })
  })

  it("should return a range of 3", function(done){
    alluvium.read("sintaxi.com", { endDay: "2015-03-18", numberOfDays: 3 }, function(data){
      data.should.have.property("version")
      data.should.have.property("range")
      data.range.should.be.instanceof(Array).and.have.lengthOf(3);
      done()
    })
  })

  // it("should return list of sites", function(done){
  //   alluvium.leaders("sintaxi.com", { endDay: "2015-03-18", numberOfDays: 3 }, function(data){
  //     data.should.have.property("version")
  //     data.should.have.property("range")
  //     data.range.should.be.instanceof(Array).and.have.lengthOf(3);
  //     done()
  //   })
  // })

  after(function(done){
    redisClient.flushall(function(){
      redisClient.quit(function(){
        done()  
      })
    })
  })

})