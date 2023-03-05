import Server from "./server.js";
import async_hooks from "node:async_hooks";
import { init, before, after } from "./hooks.js";

export class Router extends Server {
  async computeThreshold(requestType, destination, cb) {
    destination.profiler = async_hooks.createHook({
      init,
      before,
      after,
    });
    destination.cb = cb;
    destination.metrics = {
      timeElapsed: 0,
    };

    Object.assign(destination.profiler, {
      requestType,
      destination,
    });

    return {
      latency: 15,
    };
  }

  static populateRoutes(requestType, branch) {
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
    let destination = Router.populateRoutes("GET", branch);
    destination.branch = branch;

    destination.thresholds = this.computeThreshold("GET", destination, cb);
  }

  post(branch, cb) {
    let destination = Router.populateRoutes("GET", branch);
    destination.branch = branch;

    destination.thresholds = this.computeThreshold("GET", destination, cb);
  }

  delete(branch, cb) {
    let destination = Router.populateRoutes("GET", branch);
    destination.branch = branch;

    destination.thresholds = this.computeThreshold("GET", destination, cb);
  }
}
