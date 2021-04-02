
var should  = require("should")
var helpers = require("../lib/helpers.js")


describe("helpers.day", function(){

  it("should exist", function(done){
    should.exist(helpers)
    helpers.should.have.property("day").and.be.a.Function
    done()
  })

  it("should return today", function(done){
    var today = helpers.day()
    var year  = today.split("-")[0]
    var month = today.split("-")[1]
    var day   = today.split("-")[2]
    year.should.equal(new Date().toJSON().split("T")[0].split("-")[0])
    month.should.equal(new Date().toJSON().split("T")[0].split("-")[1])
    day.should.equal(new Date().toJSON().split("T")[0].split("-")[2])
    done()
  })

  it("should return specific day", function(done){
    var today = helpers.day(new Date("2010-11-19"))
    var year  = today.split("-")[0]
    var month = today.split("-")[1]
    var day   = today.split("-")[2]
    year.should.equal("2010")
    month.should.equal("11")
    day.should.equal("19")
    done()
  })

  it("should return yesterday", function(done){
    var yesterday = helpers.day(null, -1)
    var year  = yesterday.split("-")[0]
    var month = yesterday.split("-")[1]
    var day   = yesterday.split("-")[2]
    var dateObj = new Date()
    dateObj.setDate(dateObj.getDate() - 1)
    year.should.equal(dateObj.toJSON().split("T")[0].split("-")[0])
    month.should.equal(dateObj.toJSON().split("T")[0].split("-")[1])
    day.should.equal(dateObj.toJSON().split("T")[0].split("-")[2])
    done()
  })

  it("should return three days ago", function(done){
    var threeDaysAgo = helpers.day(null, -3)
    var year  = threeDaysAgo.split("-")[0]
    var month = threeDaysAgo.split("-")[1]
    var day   = threeDaysAgo.split("-")[2]
    var dateObj = new Date()
    dateObj.setDate(dateObj.getDate() - 3)
    year.should.equal(dateObj.toJSON().split("T")[0].split("-")[0])
    month.should.equal(dateObj.toJSON().split("T")[0].split("-")[1])
    day.should.equal(dateObj.toJSON().split("T")[0].split("-")[2])
    done()
  })

  it("should return a week prior to a specific day", function(done){
    var weekPriorToJan5th = helpers.day("2021-01-5", -7)
    var year  = weekPriorToJan5th.split("-")[0]
    var month = weekPriorToJan5th.split("-")[1]
    var day   = weekPriorToJan5th.split("-")[2]
    year.should.equal("2020")
    month.should.equal("12")
    day.should.equal("29")
    done()
  })

})

describe("helpers.range", function(){

  it("should exist", function(done){
    should.exist(helpers.range)
    helpers.should.have.property("range").and.be.a.Function
    done()
  })

  it("should return array", function(done){
    should.exist(helpers.range)
    helpers.range().should.be.instanceOf(Array)
    done()
  })

  it("should return array", function(done){
    should.exist(helpers.range)
    helpers.range({ numberOfDays: 7 }).should.have.lengthOf(7)
    done()
  })

})

describe("helpers.merge", function(){
  it("should exist", function(done){
    should.exist(helpers.merge)
    helpers.should.have.property("merge").and.be.a.Function
    done()
  })

  it("should merge all properties", function(done){
    helpers.merge()
    helpers.should.have.property("merge").and.be.a.Function

    var payload = { 
      "sfo": {
        general: {
          visits:     { total: 44,  breakdown: [9,5,12,18] },
          connAll:    { total: 117,  breakdown: [41,23, 34, 19] },
        }
      },

      "jfk": {
        general: {
          visits:     { total: 6,  breakdown: [1,3,2,0] },
          connAll:    { total: 17,  breakdown: [6,7, 4, 0] },
        }
      }
    }

    var result = helpers.merge(payload)

    result.should.eql({
      general: {
        visits:     { total: 50,  breakdown: [10,8,14,18] },
        connAll:    { total: 134,  breakdown: [47,30, 38, 19] },
      }
    })

    done()
  })
})

describe("helpers.normalize", function(){

  it("should exist", function(done){
    should.exist(helpers.normalize)
    helpers.should.have.property("normalize").and.be.a.Function
    done()
  })

  it("should return object", function(done){
    var analytics = {
      version: "0.5.0",
      domain: "sintaxi.com",
      range: [
        "2020-12-30",
        "2020-12-31",
        "2021-01-01",
        "2021-01-02"
      ],
      general: {
        visits:     { total: 20,  breakdown: [4,4,6,6] },
        connAll:    { total: 20,  breakdown: [4,4,6,6] },
        connEn:     { total: 0,   breakdown: [0,0,0,0] },
        connUn:     { total: 0,   breakdown: [0,0,0,0] },
        connR2En:   { total: 0,   breakdown: [0,0,0,0] },
        connR2Un:   { total: 0,   breakdown: [0,0,0,0] },
        st200:      { total: 4,   breakdown: [1,1,1,1] },
        st404:      { total: 2,   breakdown: [0,0,0,2] },
        st301:      { total: 0,   breakdown: [0,0,0,0] },
        st304:      { total: 14,  breakdown: [3,3,5,3] },
        bwH:        { total: 0,   breakdown: [0,0,0,0] },
        bwB:        { total: 0,   breakdown: [0,0,0,0] },
        bwT:        { total: 0,   breakdown: [0,0,0,0] }
      },
      pSuccess:{
        "/":       { total: 4, breakdown: [ 0, 0, 0, 4 ] },
        "/prices": {  total: 8, breakdown: [ 1, 4, 1, 2 ] }
      },
      pFail:{
        "/not-there": { total: 4, breakdown: [ 0, 0, 0, 4 ] },
        "/admin": {  total: 8, breakdown: [ 1, 4, 1, 2 ] }
      },
      pRedirect:{
        "/blog": { total: 4, breakdown: [ 0, 0, 0, 4 ] },
        "/faq": {  total: 8, breakdown: [ 1, 4, 1, 2 ] }
      },
      devices:     {},
      os:         {},
      browser:    {},
      bwFile:{
        "/main.css": { total: 4, breakdown: [ 0, 0, 0, 4 ] },
        "/index.html": {  total: 8, breakdown: [ 1, 4, 1, 2 ] }
      },
      sources:{
        "twitter.com/status/12345": { total: 4, breakdown: [ 0, 0, 0, 4 ] },
        "twitter.com/status/6789": {  total: 2, breakdown: [ 0, 0, 0, 2 ] }
      }
    }
    var normal = helpers.normalize(analytics)
    //console.log(normal)
    
    normal.should.have.property("version", "0.5.0")
    normal.should.have.property("domain", "sintaxi.com")
    normal.should.have.property("range")

    

    normal.should.have.property("traffic")
    normal.traffic.should.have.property("connections")
    normal.traffic.should.have.property("visits")
    normal.traffic.should.have.property("uniques")

    normal.should.have.property("encryption")
    normal.encryption.should.have.property("connEn")
    normal.encryption.should.have.property("connUn")
    normal.encryption.should.have.property("connR2En")
    normal.encryption.should.have.property("connR2Un")

    normal.should.have.property("bandwidth")
    normal.bandwidth.should.have.property("all")
    normal.bandwidth.should.have.property("headers")
    normal.bandwidth.should.have.property("body")

    normal.should.have.property("status")
    normal.status.should.be.instanceof(Array).and.have.lengthOf(4)

    normal.should.have.property("device")
    normal.device.should.be.instanceof(Array)

    normal.should.have.property("os")
    normal.os.should.be.instanceof(Array)

    normal.should.have.property("browser")
    normal.browser.should.be.instanceof(Array)

    normal.should.have.property("load")
    normal.load.should.be.instanceof(Array)

    normal.should.have.property("success")
    normal.success.should.be.instanceof(Array)

    normal.should.have.property("fail")
    normal.fail.should.be.instanceof(Array)

    normal.should.have.property("redirect")
    normal.redirect.should.be.instanceof(Array)

    done()
  })

  it("should return array", function(done){
    should.exist(helpers.range)
    helpers.range({ numberOfDays: 7 }).should.have.lengthOf(7)
    done()
  })

})



















