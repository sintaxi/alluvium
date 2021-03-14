
var should  = require("should")
var helpers = require("../lib/helpers.js")


describe("helpers", function(){

  it("should exist", function(done){
    should.exist(helpers)
    helpers.should.have.property("day").and.be.a.Function
    done()
  })

  it("should use helpers.day to return today", function(done){
    var today = helpers.day()
    var year  = today.split("-")[0]
    var month = today.split("-")[1]
    var day   = today.split("-")[2]
    year.should.equal(new Date().toJSON().split("T")[0].split("-")[0])
    month.should.equal(new Date().toJSON().split("T")[0].split("-")[1])
    day.should.equal(new Date().toJSON().split("T")[0].split("-")[2])
    done()
  })

  it("should use helpers.day to return specific day", function(done){
    var today = helpers.day(new Date("2010-11-19"))
    var year  = today.split("-")[0]
    var month = today.split("-")[1]
    var day   = today.split("-")[2]
    year.should.equal("2010")
    month.should.equal("11")
    day.should.equal("19")
    done()
  })

  it("should use helpers.day to return yesterday", function(done){
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

  it("should use helpers.day to return three days ago", function(done){
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

  it("should use helpers.day to return a week prior to a specific day", function(done){
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