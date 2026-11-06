var should   = require("should")
var helpers  = require("../lib/helpers")
var Alluvium = require("../")
var fixture  = require("./merge-payload.json")

// the stats path degrades, it never breaks: a bad edge reply costs that
// edge's share and is named; it never throws in slushi (where a throw
// takes the api worker) and write never throws in knob (where it runs
// on the serving path)

var counters = function(t){
  // a full set of counters with tC/tU carrying t per day
  var g = {}
  ;["tC", "tV", "tU", "cE", "cU", "cRe", "cRu", "bH", "bB", "bA", "xH", "xM", "dC", "dU"].forEach(function(stat){
    g[stat] = { t: 0, s: t.map(function(){ return 0 }) }
  })
  g.tC = { t: t.reduce(function(a, b){ return a + b }, 0), s: t.slice() }
  return g
}

var reply = function(range, perDay){
  return { domain: "sintaxi.com", version: "0.10.1", range: range, g: counters(perDay) }
}

var R = ["2026-11-01", "2026-11-02", "2026-11-03", "2026-11-04"]

describe("merge tolerance", function(){

  it("answers null for no usable reply, never throws", function(){
    should(helpers.merge()).equal(null)
    should(helpers.merge(null)).equal(null)
    should(helpers.merge({})).equal(null)
    should(helpers.merge("garbage")).equal(null)
    should(helpers.merge({ "sfo-12.surge.sh": null, "jfk-03.surge.sh": "nope" })).equal(null)
  })

  it("drops and names a bad reply, merges the rest", function(){
    var m = helpers.merge({
      "sfo-12.surge.sh": reply(R, [1, 1, 1, 1]),
      "jfk-03.surge.sh": { domain: "sintaxi.com" },
      "ams-06.surge.sh": { error: "redis down" },
      "lhr-05.surge.sh": reply(["yesterday"], [1]),
      "yyz-07.surge.sh": reply(R, [2, 2, 2, 2])
    })
    m.g.tC.s.should.eql([3, 3, 3, 3])
    m.g.tC.t.should.equal(12)
    m.edges.answered.should.eql(["sfo-12", "yyz-07"])
    m.edges.dropped.should.eql({ "jfk-03": "no range", "ams-06": "error: redis down", "lhr-05": "bad range" })
  })

  it("counts a stat one edge lacks as zero (an old knob beside a new one)", function(){
    var older = reply(R, [1, 1, 1, 1])
    var newer = reply(R, [1, 1, 1, 1])
    newer.g.kH = { t: 4, s: [1, 1, 1, 1] }
    delete older.g.dU
    // both orders: the old merge threw when the first edge lacked the stat
    ;[{ a: older, b: newer }, { a: newer, b: older }].forEach(function(o){
      var m = helpers.merge({ "sfo-12.surge.sh": o.a, "jfk-03.surge.sh": o.b })
      m.g.kH.should.eql({ t: 4, s: [1, 1, 1, 1] })
      m.g.dU.should.eql({ t: 0, s: [0, 0, 0, 0] })
      m.g.tC.t.should.equal(8)
    })
  })

  it("aligns series by date, not position", function(){
    // jfk's day boundary is one day ahead: its index 0 is sfo's index 1
    var m = helpers.merge({
      "sfo-12.surge.sh": reply(R, [1, 2, 3, 4]),
      "yyz-07.surge.sh": reply(R, [1, 2, 3, 4]),
      "jfk-03.surge.sh": reply(["2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05"], [20, 30, 40, 50])
    })
    m.range.should.eql(R)
    m.g.tC.s.should.eql([2, 24, 36, 48])
    m.g.tC.t.should.equal(110)
    // per edge, also on the merged range
    m.tCr["jfk-03"].s.should.eql([0, 20, 30, 40])
  })

  it("takes the range most edges answered, then the longest", function(){
    var long = ["2026-10-29", "2026-10-30", "2026-10-31"].concat(R)
    var m = helpers.merge({
      "sfo-12.surge.sh": reply(R, [1, 1, 1, 1]),
      "jfk-03.surge.sh": reply(long, [5, 5, 5, 1, 1, 1, 1])
    })
    m.range.should.eql(long)
    m.g.tC.s.should.eql([5, 5, 5, 2, 2, 2, 2])

    var majority = helpers.merge({
      "sfo-12.surge.sh": reply(R, [1, 1, 1, 1]),
      "yyz-07.surge.sh": reply(R, [1, 1, 1, 1]),
      "jfk-03.surge.sh": reply(long, [5, 5, 5, 1, 1, 1, 1])
    })
    majority.range.should.eql(R)
    majority.g.tC.s.should.eql([3, 3, 3, 3])
  })

  it("sums per-day tables, tolerating a missing day or table", function(){
    var a = reply(R, [1, 1, 1, 1])
    var b = reply(R, [1, 1, 1, 1])
    a.uB = { "2026-11-04": { "Chrome 140": 3 }, "2026-11-03": { "Chrome 140": 1 } }
    b.uB = { "2026-11-04": { "Chrome 140": 2, "Safari 18": "x" } }
    b.rS = "not an object"
    var m = helpers.merge({ "sfo-12.surge.sh": a, "jfk-03.surge.sh": b })
    m.uB["2026-11-04"].should.eql({ "Chrome 140": 5, "Safari 18": 0 })
    m.uB["2026-11-03"].should.eql({ "Chrome 140": 1 })
    m.uB["2026-11-02"].should.eql({})
    m.rS.should.eql({ "2026-11-02": {}, "2026-11-03": {}, "2026-11-04": {} })
  })

  it("treats non-numbers as zero", function(){
    var a = reply(R, [1, 1, 1, 1])
    a.g.tC.s = [1, "2", null, "x"]
    var m = helpers.merge({ "sfo-12.surge.sh": a, "jfk-03.surge.sh": { range: R, g: { tC: "bad" } } })
    m.g.tC.s.should.eql([1, 2, 0, 0])
  })

  it("gives the 12-edge fixture the same numbers the old merge did", function(){
    // totals from alluvium 0.10.1's index-based merge on this fixture
    // (all edges answer the same range, so position and date agree)
    var m = helpers.merge(JSON.parse(JSON.stringify(fixture)))
    var expect = {}
    Object.keys(fixture).forEach(function(dc){
      Object.keys(fixture[dc].g).forEach(function(stat){
        expect[stat] = expect[stat] || fixture[dc].g[stat].s.map(function(){ return 0 })
        fixture[dc].g[stat].s.forEach(function(v, i){ expect[stat][i] += v })
      })
    })
    Object.keys(expect).forEach(function(stat){
      m.g[stat].s.should.eql(expect[stat])
    })
    m.edges.answered.should.have.lengthOf(Object.keys(fixture).length)
  })
})

describe("normalize tolerance", function(){

  it("shapes anything into counters the cli can read", function(){
    ;[undefined, null, {}, { range: R }, { range: R, g: { tC: "bad" } }].forEach(function(input){
      var n = helpers.normalize(input)
      n.traffic.uniques.should.have.property("t", 0)
      n.traffic.uniques.s.should.be.instanceof(Array)
      n.encryption.cE.should.have.property("t", 0)
      n.bandwidth.all.should.have.property("s")
      n.datacenters.should.eql({})
    })
  })

  it("passes through who answered", function(){
    var n = helpers.normalize(helpers.merge({ "sfo-12.surge.sh": reply(R, [1, 1, 1, 1]), "jfk-03.surge.sh": null }))
    n.edges.should.eql({ answered: ["sfo-12"], dropped: { "jfk-03": "not an object" } })
    n.traffic.connections.t.should.equal(4)
  })
})

describe("write tolerance", function(){

  var throwing = { connected: true, multi: function(){ throw new Error("boom") } }

  it("never throws on odd input or a failing client", function(done){
    var clients = [
      Alluvium.createClient({ redisClient: throwing }),
      Alluvium.createClient({ redisClient: { connected: false } }),
      Alluvium.createClient({})
    ]
    var inputs = [
      undefined, null, {}, "string",
      { domain: "x.com" },
      { domain: "x.com", status: undefined, path: undefined, referrer: "%%%://" },
      { domain: "x.com", status: 301, ua: { not: "a string" }, referrer: {} }
    ]
    var calls = 0, expected = clients.length * inputs.length
    clients.forEach(function(c){
      inputs.forEach(function(input){
        c.write(input, function(){ if (++calls === expected) done() })
      })
    })
  })
})

describe("read tolerance", function(){

  it("answers an error payload when the client itself throws", function(done){
    var broken = { connected: true, multi: function(){ throw new Error("closed") } }
    Alluvium.createClient({ redisClient: broken }).read("sintaxi.com", function(data){
      data.should.have.property("error", "closed")
      data.range.should.have.lengthOf(14)
      done()
    })
  })

  it("answers an error payload the merge drops, when redis fails", function(done){
    var failing = {
      connected: true,
      multi: function(){
        var m = { zrevrange: function(){ return m }, exec: function(cb){ cb(new Error("LOADING")) } }
        return m
      }
    }
    Alluvium.createClient({ redisClient: failing }).read("sintaxi.com", { numberOfDays: 4 }, function(data){
      data.should.have.property("error", "LOADING")
      data.range.should.have.lengthOf(4)
      var m = helpers.merge({ "sfo-12.surge.sh": data, "jfk-03.surge.sh": reply(data.range, [1, 1, 1, 1]) })
      m.edges.dropped.should.eql({ "sfo-12": "error: LOADING" })
      m.g.tC.t.should.equal(4)
      done()
    })
  })
})
