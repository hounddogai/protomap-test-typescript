import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStrictQueueVarianceReport } from "./strict-queue-variance-report.js";
import { StrictQueueVariance, newStrictQueueVariance } from "./strict-queue-variance.js";

test("StrictQueueVarianceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_820_726);
  const items: StrictQueueVariance[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newStrictQueueVariance(`strict-queue-variance-${index}`, "sample"));
  }
  const report = buildStrictQueueVarianceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
