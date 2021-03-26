var helpers = require("../../../lib/helpers")

module.exports = {
  domain: "paths.com",

  range: [
    "2020-12-30",
    "2020-12-31",
    "2021-01-01",
    "2021-01-02"
  ],

  general: {
    trC:        { total: 6, breakdown: [0,2,2,2] },
    trV:        { total: 6, breakdown: [0,2,2,2] },
    trU:        { total: 4, breakdown: [0,2,1,1] },
    connEn:     { total: 0, breakdown: [0,0,0,0] },
    connUn:     { total: 0, breakdown: [0,0,0,0] },
    connR2En:   { total: 0, breakdown: [0,0,0,0] },
    connR2Un:   { total: 0, breakdown: [0,0,0,0] },
    st200:      { total: 6, breakdown: [0,2,2,2] },
    st404:      { total: 0, breakdown: [0,0,0,0] },
    st301:      { total: 0, breakdown: [0,0,0,0] },
    bwH:        { total: 0, breakdown: [0,0,0,0] },
    bwB:        { total: 0, breakdown: [0,0,0,0] },
    bwT:        { total: 0, breakdown: [0,0,0,0] },
    cacheHIT:   { total: 0, breakdown: [0,0,0,0] },
    cacheMISS:  { total: 0, breakdown: [0,0,0,0] }
  },

  uaDevice:     {},
  uaOS:         {},
  uaBrowser:    {},
  bwFile:       {},
  sources:      {}

}