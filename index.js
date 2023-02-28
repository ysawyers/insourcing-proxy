import Server from "./server.js";
import { profileAsyncRoute } from "./hooks.js";

export class Router extends Server {
  async computeThreshold(requestType, branch, cb) {
    await profileAsyncRoute(requestType, branch, cb);

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
    destination.cb = cb;

    destination.thresholds = this.computeThreshold("GET", branch, cb);
  }

  post(branch, cb) {
    let destination = Router.populateRoutes("POST", branch);
    destination.cb = cb;

    destination.thresholds = this.computeThreshold("GET", branch, cb);
  }

  delete(branch, cb) {
    let destination = Router.computeThreshold("DELETE", branch);
    destination.cb = cb;

    destination.thresholds = this.computeThreshold("GET", branch, cb);
  }
}
