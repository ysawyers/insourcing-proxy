import { triggerAsyncId } from "node:async_hooks";

import fs from "fs";

const NS_PER_SEC = 1e9;
const MS_PER_NS = 1e-6;

let time;
let currentTriggerId;

export function init(asyncId, type) {
  if (type === "TCPWRAP") {
    currentTriggerId = asyncId;
  }
}

export function before() {
  if (triggerAsyncId() === currentTriggerId) {
    time = process.hrtime();
  }
}

export function after(asyncId) {
  if (asyncId === currentTriggerId) {
    const diff = process.hrtime(time);
    const ms = diff[0] * NS_PER_SEC + diff[1] * MS_PER_NS;

    try {
      let totalElapsedTime = this.destination.metrics["timeElapsed"];
      this.destination.metrics = {
        timeElapsed: totalElapsedTime + parseFloat(ms.toFixed(2)),
      };
    } catch (_) {
      this.destination.metrics = {
        timeElapsed: parseFloat(ms.toFixed(2)),
      };
    }
    this.destination.metrics["timeElapsed"];
  }
}

// count the number of occurances of calls on load and
// then wait for that number to be reached
