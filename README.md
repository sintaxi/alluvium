# alluvium

> Time-series analytics for static web servers.

#### Goals

- show number of requests over time (granular to the day)
- show response status codes by volume (200, 301, 304, 404, 401, etc)
- show number of requests by device type (desktop, mobile, tablet, tv, etc)
- show top referrer for each endpoint


#### alluvium.createClient(cfg)

    var alluvium = require("alluvium").createClient()

#### alluvium.write(data [,callback])

    alluvium.write({
      "domain": "sintaxi.com",
      "path": "/",
      "status": 200,
      "device": "phone",
      "method": "get",
      "referrer": null
    })

#### alluvium.read(domain, [options,] callback)

    alluvium.read("sintaxi.com", function(results){
      console.log(results)

      // returns...

      { version: '0.1.0', range: '2015-3-18', totals:
       { statuses: { '200': 152, '304': 520, '404': 76 },
         visits:
          { '/about': 216,
            '/contact': 152,
            '/blog/hi': 152,
            '/': 152,
            '/not-exist': 76 },
         devices: { phone: 368, desktop: 304, tablet: 76 } } }
    })
