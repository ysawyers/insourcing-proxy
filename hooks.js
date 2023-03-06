import { triggerAsyncId } from "node:async_hooks";

const NS_PER_SEC = 1e9;
const MS_PER_NS = 1e-6;

export function init(asyncId, type) {
  if (type === "TCPWRAP") {
    this.currentTriggerId = asyncId;
  }
}

export function before() {
  if (triggerAsyncId() === this.currentTriggerId) {
    this.startTime = process.hrtime();
  }
}

export function after(asyncId) {
  if (asyncId === this.currentTriggerId) {
    const diff = process.hrtime(this.startTime);
    const ms = diff[0] * NS_PER_SEC + diff[1] * MS_PER_NS;

    let totalElapsedTime = this.destination.metrics["timeElapsed"];
    this.destination.metrics = {
      ...this.destination.metrics,
      timeElapsed: totalElapsedTime + parseFloat(ms.toFixed(2)),
    };
  }
}
