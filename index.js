import Server from "./server.js";

export class Router extends Server {
  async computeThreshold(cb) {
    console.time();
    try {
      await cb();
    } catch (_) {
      console.log("dsdasdsa");
    }
    console.timeEnd();
    return {
      latency: 15,
    };
  }

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

    destination.thresholds = this.computeThreshold(cb);
  }

  post(branch, cb) {
    let destination = this.populateRoutes("POST", branch);
    destination.cb = cb;

    destination.thresholds = this.computeThreshold(cb);
  }

  delete(branch, cb) {
    let destination = this.populateRoutes("DELETE", branch);
    destination.cb = cb;

    destination.thresholds = this.computeThreshold(cb);
  }
}
