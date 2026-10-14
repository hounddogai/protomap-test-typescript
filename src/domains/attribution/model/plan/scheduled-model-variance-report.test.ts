import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildScheduledModelVarianceReport } from "./scheduled-model-variance-report.js";
import { ScheduledModelVariance, newScheduledModelVariance } from "./scheduled-model-variance.js";

test("ScheduledModelVarianceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_900_089);
  const items: ScheduledModelVariance[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newScheduledModelVariance(`scheduled-model-variance-${index}`, "sample"));
  }
  const report = buildScheduledModelVarianceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
