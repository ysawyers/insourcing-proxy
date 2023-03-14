import Server from "./server.js";
import async_hooks from "node:async_hooks";
import { init, after } from "./hooks.js";

export class Router extends Server {
  #generateMetrics(requestType, destination, cb) {
    destination.profiler = async_hooks.createHook({
      init,
      after,
    });
    destination.cb = cb;
    destination.metrics = {
      en: [],
      ec: 0,
    };

    Object.assign(destination.profiler, {
      destination,
      currentlyElapsed: 0,
    });
  }

  static #populateRoutes(requestType, slug) {
    let currentNode = Router.routes.get(requestType);

    let destinations = slug.split("/");
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

  get(slug, cb) {
    let destination = Router.#populateRoutes("GET", slug);
    destination.slug = slug;

    this.#generateMetrics("GET", destination, cb);
  }

  post(slug, cb) {
    let destination = Router.#populateRoutes("POST", slug);
    destination.slug = slug;

    this.#generateMetrics("POST", destination, cb);
  }

  put(slug, cb) {
    let destination = Router.#populateRoutes("PUT", slug);
    destination.slug = slug;

    this.#generateMetrics("PUT", destination, cb);
  }

  delete(slug, cb) {
    let destination = Router.#populateRoutes("DELETE", slug);
    destination.slug = slug;

    this.#generateMetrics("DELETE", destination, cb);
  }
}
