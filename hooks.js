import async_hooks from "node:async_hooks";
import httpMocks from "node-mocks-http";
import fs from "fs";

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

function init(asyncId, type, triggerAsyncId) {
  if (type === "TCPWRAP") {
    time = process.hrtime();
    currentTriggerId = triggerAsyncId;

    fs.writeSync(
      1,
      `Init ${type} resource: asyncId: ${asyncId} trigger: ${triggerAsyncId}\n`
    );
  }
}

function promiseResolve(asyncId) {
  if (asyncId === currentTriggerId) {
    const diff = process.hrtime(time);
    const ms = diff[0] * NS_PER_SEC + diff[1] * MS_PER_NS;

    // console.log(`Promise Resolve: ${ms.toFixed(2)}ms`);

    const destination = Router.populateRoutes(this.requestType, this.branch);
    destination.metrics = {
      timeElapsed: parseFloat(ms.toFixed(2)),
    };
  }
}

const asyncHooks = async_hooks.createHook({
  init,
  promiseResolve,
});

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function profileAsyncRoute(requestType, branch, cb) {
  const mockRequest = httpMocks.createRequest({
    method: requestType,
    url: branch,
    params: {},
  });
  const mockResponse = httpMocks.createResponse();

  asyncHooks.enable();
  await sleep(0);

  Object.assign(asyncHooks, { branch, requestType });
  await cb(mockRequest, mockResponse);

  asyncHooks.disable();
}
