var helpers = require("../../../lib/helpers")
var date    = helpers.day()

module.exports = [ 
  { ip: "123", timestamp: "2020-12-31", domain: "paths.com", status: 200, path: "/foo" },
  { ip: "456", timestamp: "2020-12-31", domain: "paths.com", status: 200, path: "/foo" },
  { ip: "123", timestamp: "2021-01-01", domain: "paths.com", status: 200, path: "/" },
  { ip: "123", timestamp: "2021-01-01", domain: "paths.com", status: 200, path: "/" },
  { ip: "456", timestamp: "2021-01-02", domain: "paths.com", status: 200, path: "/" },
  { ip: "456", timestamp: "2021-01-02", domain: "paths.com", status: 200, path: "/" }
]