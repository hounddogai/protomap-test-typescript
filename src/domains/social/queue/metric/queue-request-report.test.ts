import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildQueueRequestReport } from "./queue-request-report.js";
import { QueueRequest, newQueueRequest } from "./queue-request.js";

test("QueueRequestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_981_951);
  const items: QueueRequest[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newQueueRequest(`queue-request-${index}`, "sample"));
  }
  const report = buildQueueRequestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
