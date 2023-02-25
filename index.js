import Server from "./server.js";
import httpMocks from "node-mocks-http";
import async_hooks from "node:async_hooks";

let requestCount = 0;

const asyncHook = async_hooks.createHook({
  init(asyncId, type, triggerAsyncId, resource) {
    if (type === "TCPWRAP" || type === "HTTPPARSER") {
      requestCount++;

      // get total bytes read (processed whatever)

      // calculate how fast (Mbps) to process in a "reasonable"
      // amount of time

      // If the client (Mbps) is below this threshold we know
      // we need to insource.
    }
  },
});

export class Router extends Server {
  async computeThreshold(requestType, branch, cb) {
    const mockRequest = httpMocks.createRequest({
      method: requestType,
      url: branch,
      params: {},
    });
    const mockResponse = httpMocks.createResponse();

    asyncHook.enable();
    await cb(mockRequest, mockResponse);
    asyncHook.disable();

    // number of ajax requests being made
    console.log(requestCount - 1);

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

    destination.thresholds = this.computeThreshold("GET", branch, cb);
  }

  post(branch, cb) {
    let destination = this.populateRoutes("POST", branch);
    destination.cb = cb;

    destination.thresholds = this.computeThreshold("GET", branch, cb);
  }

  delete(branch, cb) {
    let destination = this.populateRoutes("DELETE", branch);
    destination.cb = cb;

    destination.thresholds = this.computeThreshold("GET", branch, cb);
  }
}
