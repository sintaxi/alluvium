
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
        domain: "sintaxi.com",
        range: [
          "2020-12-30",
          "2020-12-31",
          "2021-01-01",
          "2021-01-02"
        ],
        g: {
          tC:  { t: 21, s: [4,5,6,6] },
          tV:  { t: 4,  s: [1,1,1,1] },
          tU:  { t: 8,  s: [3,1,2,2] },
          cE:  { t: 0,  s: [0,0,0,0] },
          cU:  { t: 0,  s: [0,0,0,0] },
          cRe: { t: 0,  s: [0,0,0,0] },
          cRu: { t: 0,  s: [0,0,0,0] },
          bH:  { t: 0,  s: [0,0,0,0] },
          bB:  { t: 0,  s: [0,0,0,0] },
          bA:  { t: 0,  s: [0,0,0,0] },
          xH:  { t: 0,  s: [0,0,0,0] },
          xM:  { t: 0,  s: [0,0,0,0] },
          dC:  { t: 2,  s: [0,0,2,0] },
          dU:  { t: 4,  s: [1,1,1,1] }
        },
        uD: {
          "2021-01-02":  { "Unknown": 6 },
          "2021-01-01":  { "Unknown": 6 },
          "2020-12-31":  { "Unknown": 5 }
        },
      },

      "jfk": {
        domain: "sintaxi.com",
        range: [
          "2020-12-30",
          "2020-12-31",
          "2021-01-01",
          "2021-01-02"
        ],
        g: {
          tC:  { t: 21, s: [4,5,6,6] },
          tV:  { t: 4,  s: [1,1,1,1] },
          tU:  { t: 8,  s: [3,1,2,2] },
          cE:  { t: 0,  s: [0,0,0,0] },
          cU:  { t: 0,  s: [0,0,0,0] },
          cRe: { t: 0,  s: [0,0,0,0] },
          cRu: { t: 0,  s: [0,0,0,0] },
          bH:  { t: 0,  s: [0,0,0,0] },
          bB:  { t: 0,  s: [0,0,0,0] },
          bA:  { t: 0,  s: [0,0,0,0] },
          xH:  { t: 0,  s: [0,0,0,0] },
          xM:  { t: 0,  s: [0,0,0,0] },
          dC:  { t: 2,  s: [0,0,2,0] },
          dU:  { t: 4,  s: [1,1,1,1] }
        },
        uD: {
          "2021-01-02":  { "Unknown": 6 },
          "2021-01-01":  { "Unknown": 6 },
          "2020-12-31":  { "Unknown": 5 }
        },
      }
    }

    var result = helpers.merge(payload)

    result.should.eql({
      domain: "sintaxi.com",
      range: [
        "2020-12-30",
        "2020-12-31",
        "2021-01-01",
        "2021-01-02"
      ],
      g: {
        tC: { t: 42,  s: [8,10,12,12] },
        tV:  { t: 8,  s: [2,2,2,2] },
        tU: { t: 16,  s: [6,2, 4, 4] },
        cE:  { t: 0,  s: [0,0,0,0] },
        cU:  { t: 0,  s: [0,0,0,0] },
        cRe: { t: 0,  s: [0,0,0,0] },
        cRu: { t: 0,  s: [0,0,0,0] },
        bH:  { t: 0,  s: [0,0,0,0] },
        bB:  { t: 0,  s: [0,0,0,0] },
        bA:  { t: 0,  s: [0,0,0,0] },
        xH:  { t: 0,  s: [0,0,0,0] },
        xM:  { t: 0,  s: [0,0,0,0] },
        dC:  { t: 4,  s: [0,0,4,0] },
        dU:  { t: 8,  s: [2,2,2,2] }
      },
      uD: {
        "2021-01-02":  { "Unknown": 12 },
        "2021-01-01":  { "Unknown": 12 },
        "2020-12-31":  { "Unknown": 10 }
      },
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
      g: {
        tC:  { t: 21, s: [4,5,6,6] },
        tV:  { t: 4,  s: [1,1,1,1] },
        tU:  { t: 8,  s: [3,1,2,2] },
        cE:  { t: 0,  s: [0,0,0,0] },
        cU:  { t: 0,  s: [0,0,0,0] },
        cRe: { t: 0,  s: [0,0,0,0] },
        cRu: { t: 0,  s: [0,0,0,0] },
        bH:  { t: 0,  s: [0,0,0,0] },
        bB:  { t: 0,  s: [0,0,0,0] },
        bA:  { t: 0,  s: [0,0,0,0] },
        xH:  { t: 0,  s: [0,0,0,0] },
        xM:  { t: 0,  s: [0,0,0,0] },
        dC:  { t: 2,  s: [0,0,2,0] },
        dU:  { t: 4,  s: [1,1,1,1] }
      },
      uD: {
        "2021-01-02":  { "Unknown": 6 },
        "2021-01-01":  { "Unknown": 6 },
        "2020-12-31":  { "Unknown": 5 }
      },
      uO: {
        "2021-01-02":  { "Unknown": 6 },
        "2021-01-01":  { "Unknown": 6 },
        "2020-12-31":  { "Unknown": 5 }
      },
      uB: {
        "2021-01-02":  { "Unknown": 6 },
        "2021-01-01":  { "Unknown": 6 },
        "2020-12-31":  { "Unknown": 5 }
      },
      bF: {
        "2021-01-02":  {},
        "2021-01-01":  {},
        "2020-12-31":  {}
      },
      rS: {
        "2021-01-02": {
          "twitter.com/status/12345": 4,
          "twitter.com/status/6789": 2
        },
        "2021-01-01":  {},
        "2020-12-31":  {}
      },
      pR: {
        "2020-12-31": {
          "301 /foo": 1
        },
        "2021-01-01":  {},
        "2021-01-02":  {}
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
    normal.encryption.should.have.property("E")
    normal.encryption.should.have.property("U")
    normal.encryption.should.have.property("Re")
    normal.encryption.should.have.property("Ru")

    normal.should.have.property("bandwidth")
    normal.bandwidth.should.have.property("all")
    normal.bandwidth.should.have.property("headers")
    normal.bandwidth.should.have.property("body")

    // normal.should.have.property("status")
    // normal.status.should.be.instanceof(Array).and.have.lengthOf(4)

    normal.should.have.property("device")
    Object.keys(normal.device).forEach(function(day){
      normal.device[day].should.be.instanceof(Array)  
    })

    normal.should.have.property("os")
    Object.keys(normal.os).forEach(function(day){
      normal.os[day].should.be.instanceof(Array)  
    })

    normal.should.have.property("browser")
    Object.keys(normal.browser).forEach(function(day){
      normal.browser[day].should.be.instanceof(Array)  
    })

    normal.should.have.property("success")
    Object.keys(normal.success).forEach(function(day){
      normal.success[day].should.be.instanceof(Array)  
    })

    normal.should.have.property("fail")
    Object.keys(normal.fail).forEach(function(day){
      normal.fail[day].should.be.instanceof(Array)  
    })

    normal.should.have.property("redirect")
    Object.keys(normal.redirect).forEach(function(day){
      normal.redirect[day].should.be.instanceof(Array)  
    })

    normal.should.have.property("load")
    Object.keys(normal.load).forEach(function(day){
      normal.load[day].should.be.instanceof(Array)  
    })

    done()
  })

  it("should return array", function(done){
    should.exist(helpers.range)
    helpers.range({ numberOfDays: 7 }).should.have.lengthOf(7)
    done()
  })

})



















