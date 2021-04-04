module.exports =
  [ { ip: "123", timestamp: "2020-12-30", domain: "sintaxi.com", status: 200, method: "get", device: "phone",   path: "/", referrer: null }
  , { ip: "123", timestamp: "2020-12-30", domain: "sintaxi.com", status: 304, method: "get", device: "phone",   path: "/", referrer: null }
  , { ip: "456", timestamp: "2020-12-30", domain: "sintaxi.com", status: 304, method: "get", device: "phone",   path: "/", referrer: null }
  , { ip: "789", timestamp: "2020-12-30", domain: "sintaxi.com", status: 304, method: "get", device: "phone",   path: "/", referrer: null }
  , { ip: "123", timestamp: "2020-12-31", domain: "sintaxi.com", status: 200, method: "get", device: "phone",   path: "/about", referrer: null }
  , { ip: "123", timestamp: "2020-12-31", domain: "sintaxi.com", status: 301, method: "get", device: "phone",   path: "/foo", referrer: null }
  , { ip: "123", timestamp: "2020-12-31", domain: "sintaxi.com", status: 304, method: "get", device: "phone",   path: "/about", referrer: null }
  , { ip: "123", timestamp: "2020-12-31", domain: "sintaxi.com", status: 304, method: "get", device: "phone",   path: "/about", referrer: null }
  , { ip: "123", timestamp: "2020-12-31", domain: "sintaxi.com", status: 304, method: "get", device: null,      path: "/about", referrer: null }
  , { ip: "123", timestamp: "2021-01-01", domain: "sintaxi.com", status: 304, method: "get", device: null,      path: "/about", referrer: null }
  , { ip: "123", timestamp: "2021-01-01", domain: "sintaxi.com", status: 304, method: "get", device: null,      path: "/about", referrer: null }
  , { ip: "456", timestamp: "2021-01-01", domain: "sintaxi.com", status: 200, method: "get", device: "desktop", path: "/contact", referrer: null, ua: "Deno/1.8.3" }
  , { ip: "456", timestamp: "2021-01-01", domain: "sintaxi.com", status: 304, method: "get", device: "desktop", path: "/contact", referrer: null }
  , { ip: "456", timestamp: "2021-01-01", domain: "sintaxi.com", status: 304, method: "get", device: "desktop", path: "/contact", referrer: null, ua:"Deno/1.8.3" }
  , { ip: "456", timestamp: "2021-01-01", domain: "sintaxi.com", status: 304, method: "get", device: "desktop", path: "/contact", referrer: null}
  , { ip: "123", timestamp: "2021-01-02", domain: "sintaxi.com", status: 200, method: "get", device: "desktop", path: "/blog/hi", referrer: "https://twitter.com/status/12345" }
  , { ip: "123", timestamp: "2021-01-02", domain: "sintaxi.com", status: 304, method: "get", device: "desktop", path: "/blog/hi", referrer: "https://twitter.com/status/12345" }
  , { ip: "456", timestamp: "2021-01-02", domain: "sintaxi.com", status: 304, method: "get", device: "desktop", path: "/blog/hi", referrer: "https://twitter.com/status/12345" }
  , { ip: "456", timestamp: "2021-01-02", domain: "sintaxi.com", status: 304, method: "get", device: "desktop", path: "/blog/hi", referrer: "https://twitter.com/status/12345" }
  , { ip: "123", timestamp: "2021-01-02", domain: "sintaxi.com", status: 404, method: "get", device: "tablet",  path: "/not-exist", referrer: "https://twitter.com/status/6789" }
  , { ip: "123", timestamp: "2021-01-02", domain: "sintaxi.com", status: 404, method: "get", device: "tablet",  path: "/not-exist", referrer: "https://twitter.com/status/6789" }
]