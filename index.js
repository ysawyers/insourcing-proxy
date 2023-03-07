import Server from "./server.js";
import async_hooks from "node:async_hooks";
import { init, before, after } from "./hooks.js";

export class Router extends Server {
  #generateMetrics(requestType, destination, cb) {
    destination.profiler = async_hooks.createHook({
      init,
      before,
      after,
    });
    destination.cb = cb;
    destination.metrics = {
      timeElapsed: 0,
      tn: 0,
      tc: 0,
      en: 0,
    };

    Object.assign(destination.profiler, {
      requestType,
      destination,
    });
  }

  static #populateRoutes(requestType, branch) {
    let currentNode = Router.routes.get(requestType);

    let destinations = branch.split("/");
    if (destinations[0] == "") {
      destinations.shift();
    }

    for (const nextDest of destinations) {
      if (currentNode.get("/" + nextDest) === undefined) {
        currentNode.set("/" + nextDest, new Map());
      }
      currentNode = currentNode.get("/" + nextDest);
    }

    return currentNode;
  }

  get(branch, cb) {
    let destination = Router.#populateRoutes("GET", branch);
    destination.branch = branch;

    this.#generateMetrics("GET", destination, cb);
  }

  post(branch, cb) {
    let destination = Router.#populateRoutes("POST", branch);
    destination.branch = branch;

    this.#generateMetrics("POST", destination, cb);
  }

  put(branch, cb) {
    let destination = Router.#populateRoutes("PUT", branch);
    destination.branch = branch;

    this.#generateMetrics("PUT", destination, cb);
  }

  delete(branch, cb) {
    let destination = Router.#populateRoutes("DELETE", branch);
    destination.branch = branch;

    this.#generateMetrics("DELETE", destination, cb);
  }
}
