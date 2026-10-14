import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRollingQueueOverrideReport } from "./rolling-queue-override-report.js";
import { RollingQueueOverride, newRollingQueueOverride } from "./rolling-queue-override.js";

test("RollingQueueOverrideReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_259_821);
  const items: RollingQueueOverride[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newRollingQueueOverride(`rolling-queue-override-${index}`, "sample"));
  }
  const report = buildRollingQueueOverrideReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
