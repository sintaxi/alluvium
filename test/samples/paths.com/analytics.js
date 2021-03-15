var helpers = require("../../../lib/helpers")

module.exports = {
  version: "0.5.0",
  domain: "paths.com",

  range: [
    "2020-12-30",
    "2020-12-31",
    "2021-01-01",
    "2021-01-02"
  ],

  general: {
    visits:     { total: 0, breakdown: [0,0,0,0] },
    connAll:    { total: 0, breakdown: [0,0,0,0] },
    connEn:     { total: 0, breakdown: [0,0,0,0] },
    connUn:     { total: 0, breakdown: [0,0,0,0] },
    connR2En:   { total: 0, breakdown: [0,0,0,0] },
    connR2Un:   { total: 0, breakdown: [0,0,0,0] },
    st200:      { total: 0, breakdown: [0,0,0,0] },
    st404:      { total: 0, breakdown: [0,0,0,0] },
    st301:      { total: 0, breakdown: [0,0,0,0] },
    bwH:        { total: 0, breakdown: [0,0,0,0] },
    bwB:        { total: 0, breakdown: [0,0,0,0] },
    bwT:        { total: 0, breakdown: [0,0,0,0] }
  },

  uaDevice:     {},
  uaOS:         {},
  uaBrowser:    {},
  bwFile:       {}

}