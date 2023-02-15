import http from "http";

const thresholdMetrics = () => {};

const insource = () => {};

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
    const requestListener = async (req, res) => {
      res.setHeader("Content-Type", "application/json");

      if (req.url !== "/favicon.ico") {
        try {
          const cb = this.queryRoutes(req.method, req.url);

          // Add Request Timer

          await cb(req, res);
        } catch (e) {
          if (e.message === "Not Found") {
            res.writeHead(404);
          } else if (e.message === "Gateway Timeout") {
            res.writeHead(504);
          }
        }
      }

      // NOTE: Make sure to implement error handling (specifically request gone stale)
      res.end();
    };
    this.server = http.createServer(requestListener);

    this.server.listen(this.port, this.host, cb);
  }
}

export class Router extends Server {
  populateRoutes(requestType, branch) {
    let currentNode = this.routes[requestType];

    let destinations = branch.split("/");
    if (destinations[0] == "") {
      destinations.shift();
    }

    for (const nextDest of destinations) {
      if (currentNode["/" + nextDest] === undefined) {
        currentNode["/" + nextDest] = {};
      }
      currentNode = currentNode["/" + nextDest];
    }

    return currentNode;
  }

  get(branch, cb) {
    let destination = this.populateRoutes("GET", branch);
    destination.cb = cb;

    // Profile CB
  }

  post(branch, cb) {
    let destination = this.populateRoutes("POST", branch);
    destination.cb = cb;

    // Profile CB
  }

  delete(branch, cb) {
    let destination = this.populateRoutes("DELETE", branch);
    destination.cb = cb;

    // Profile CB
  }
}
