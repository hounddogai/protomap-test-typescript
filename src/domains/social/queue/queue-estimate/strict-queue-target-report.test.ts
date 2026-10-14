import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStrictQueueTargetReport } from "./strict-queue-target-report.js";
import { StrictQueueTarget, newStrictQueueTarget } from "./strict-queue-target.js";

test("StrictQueueTargetReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_348_701);
  const items: StrictQueueTarget[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newStrictQueueTarget(`strict-queue-target-${index}`, "sample"));
  }
  const report = buildStrictQueueTargetReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
