import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildQueueAdjustmentReport } from "./queue-adjustment-report.js";
import { QueueAdjustment, newQueueAdjustment } from "./queue-adjustment.js";

test("QueueAdjustmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_840_445);
  const items: QueueAdjustment[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newQueueAdjustment(`queue-adjustment-${index}`, "sample"));
  }
  const report = buildQueueAdjustmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
