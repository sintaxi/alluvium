var helpers = require("../../../lib/helpers")
var date    = helpers.day()

module.exports = [ 
  { timestamp: "2020-12-31", domain: "paths.com", status: 200, path: "/foo" },
  { timestamp: "2020-12-31", domain: "paths.com", status: 200, path: "/foo" },
  { timestamp: "2021-01-01", domain: "paths.com", status: 200, path: "/" },
  { timestamp: "2021-01-01", domain: "paths.com", status: 200, path: "/" },
  { timestamp: "2021-01-02", domain: "paths.com", status: 200, path: "/" },
  { timestamp: "2021-01-02", domain: "paths.com", status: 200, path: "/" }
]