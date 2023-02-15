import http from "http";

// NOTE: Not sure how long a request should wait before throwing
let seconds = 15;

export default class Server {
  constructor(port, host) {
    this.routes = {
      GET: {},
      POST: {},
      DELETE: {},
    };

    this.port = port;
    this.host = host;
  }

  queryRoutes(requestType, branch) {
    let destinations = branch.split("/");
    if (destinations[0] == "") {
      destinations.shift();
    }

    let currentNode = this.routes[requestType];
    for (const nextDest of destinations) {
      if (currentNode["/" + nextDest] === undefined) {
        throw new Error("Not Found");
      }
      currentNode = currentNode["/" + nextDest];
    }

    return currentNode.cb;
  }

  listenAndServe(cb) {
    const requestListener = (req, res) => {
      res.setHeader("Content-Type", "application/json");

      if (req.url !== "/favicon.ico") {
        try {
          const cb = this.queryRoutes(req.method, req.url);

          let requestTimer = setTimeout(() => {
            throw new Error("Gateway Timeout");
          }, seconds * 1000);
          requestTimer.unref();

          cb(req, res);

          if (res.headersSent) {
            requestTimer.close();
          }
          return;
        } catch (e) {
          if (e.message === "Not Found") {
            res.writeHead(404);
          } else if (e.message === "Gateway Timeout") {
            res.writeHead(504);
          }
        }
      }
    };
    this.server = http.createServer(requestListener);

    this.server.listen(this.port, this.host, cb);
  }
}
