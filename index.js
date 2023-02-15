import Server from "./server.js";

// "Profiler"
const thresholdMetrics = () => {};

// this function will be invoked with websockets
const insource = () => {};

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
