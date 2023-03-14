import { triggerAsyncId } from "node:async_hooks";
import fs from "fs";

const NS_PER_SEC = 1e9;
const MS_PER_NS = 1e-6;

export function init(asyncId, type, asyncTriggerId) {
  if (type === "TCPWRAP") {
    fs.writeFileSync(
      1,
      `(${type}): asyncId: ${asyncId} - triggerAsyncId: ${asyncTriggerId} \n`
    );

    this.destination.metrics.en.push(this.currentlyElapsed);
    this.currentlyElapsed = 0;

    this.currentTriggerId = asyncTriggerId;
    this.startTime = process.hrtime();
  }
}

export function after() {
  if (triggerAsyncId() === this.currentTriggerId) {
    const diff = process.hrtime(this.startTime);
    const endTime = diff[0] * NS_PER_SEC + diff[1] * MS_PER_NS;

    this.currentlyElapsed =
      this.currentlyElapsed + (endTime - this.currentlyElapsed);
  }
}
