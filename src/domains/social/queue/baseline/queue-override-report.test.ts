import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildQueueOverrideReport } from "./queue-override-report.js";
import { QueueOverride, newQueueOverride } from "./queue-override.js";

test("QueueOverrideReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_419_292);
  const items: QueueOverride[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newQueueOverride(`queue-override-${index}`, "sample"));
  }
  const report = buildQueueOverrideReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
