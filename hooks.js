import async_hooks, { triggerAsyncId } from "node:async_hooks";
import httpMocks from "node-mocks-http";

import { Router } from "./index.js";

const NS_PER_SEC = 1e9;
const MS_PER_NS = 1e-6;

let time;
let currentTriggerId;

export let tracedRoutes = {
  GET: {},
  POST: {},
  PUT: {},
  DELETE: {},
};

function init(asyncId, type) {
  if (type === "TCPWRAP") {
    currentTriggerId = asyncId;
  }
}

function before() {
  if (triggerAsyncId() === currentTriggerId) {
    time = process.hrtime();
  }
}

function after(asyncId) {
  if (asyncId === currentTriggerId) {
    const diff = process.hrtime(time);
    const ms = diff[0] * NS_PER_SEC + diff[1] * MS_PER_NS;

    const destination = Router.populateRoutes(this.requestType, this.branch);
    destination.metrics = {
      timeElapsed: parseFloat(ms.toFixed(2)),
    };

    console.log(destination);
  }
}

function sleep(delay) {
  var start = new Date().getTime();
  while (new Date().getTime() < start + delay);
}

export async function profileAsyncRoute(requestType, branch, cb) {
  const mockRequest = httpMocks.createRequest({
    method: requestType,
    url: branch,
    // Prevent node from re-using connection
    agent: false,
    headers: {
      "cache-control": "no-cache",
    },
    params: {},
  });
  const mockResponse = httpMocks.createResponse();

  const asyncHooks = async_hooks
    .createHook({
      init,
      before,
      after,
    })
    .enable();

  Object.assign(asyncHooks, { branch, requestType });
  await cb(mockRequest, mockResponse);
}

/**
 *
 * TODO:
 *  Fix racing conditions
 *
 *
 */
