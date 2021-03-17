module.exports = {
  version: "0.5.0",
  domain: "sintaxi.com",

  range: [
    "2020-12-30",
    "2020-12-31",
    "2021-01-01",
    "2021-01-02"
  ],

  general: {
    visits:     { total: 4,   breakdown: [1,1,1,1] },
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

  uaDevice:     {},
  uaOS:         {},
  uaBrowser:    {},
  bwFile:       {},
  sources: {
    "twitter.com/status/12345": { total: 4, breakdown: [ 0, 0, 0, 4 ] },
    "twitter.com/status/6789": {  total: 2, breakdown: [ 0, 0, 0, 2 ] }
  },
  pRedirect:{
    "/": { total: 3, breakdown: [ 3, 0, 0, 0 ] },
    "/about": { total: 5, breakdown: [ 0, 3, 2, 0 ] },
    "/blog/hi": {  total: 3, breakdown: [ 0, 0, 0, 3 ] },
    "/contact": {  total: 3, breakdown: [ 0, 0, 3, 0 ] }
  }

}