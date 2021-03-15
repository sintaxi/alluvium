var fs          = require("fs")
var ndjson      = require("ndjson")
var should      = require("should")
var redis       = require("redis")
var redisClient = redis.createClient()
var alluvium    = require("../").createClient({
  redisClient: redisClient
})

describe("samples", function(){

  var samples = fs.readdirSync(__dirname + "/samples")

  samples.forEach(function(sample){
    var mocks     = require(__dirname + "/samples/" + sample + "/" + "mocks.js")
    var analytics = require(__dirname + "/samples/" + sample + "/" + "analytics.js")

    describe(sample, function(){

      before(function(done){
        var total = mocks.length
        var count = 0
        if (count === total) return done()
        for(const mock of mocks)(function(mock){
          alluvium.write(mock, function(){
            count++
            if (count === total) return done()
          })
        })(mock)
      })

      var keys = Object.keys(analytics)

      keys.forEach(function(key){
        it("should have " + key + " and match", function(done){
          alluvium.read(sample, { endDay: "2021-01-02", numberOfDays: 4 }, function(results){
            results.should.have.property(key)
            results[key].should.eql(analytics[key])
            return done()
          })
        })
      })

    })

    after(function(done){
      redisClient.quit(function(){
        done()  
      })
    })
  })

  // before(function(done){

  //   process.stdout.write(" ")
  //   fs.createReadStream(__filename + '.data')
  //   .pipe(ndjson.parse())
  //   .on('data', alluvium.write)
  //   .on('end', done)
  // })

  // it("should exist", function(done){
  //   should.exist(alluvium)
  //   alluvium.should.have.property("write").and.be.a.Function
  //   alluvium.should.have.property("read").and.be.a.Function
  //   done()
  // })

  // it("should return version in payload", function(done){
  //   alluvium.read("sintaxi.com", { timestamp: "2015-03-18" }, function(data){
  //     data.should.have.property("version")
  //     data.should.have.property("range")
  //     console.debug(data.paths)
  //     done()
  //   })
  // })

  // after(function(done){
  //   redisClient.flushall(function(){
  //     done()
  //   })
  // })

})