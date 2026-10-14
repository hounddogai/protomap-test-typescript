import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRollingStepVarianceReport } from "./rolling-step-variance-report.js";
import { RollingStepVariance, newRollingStepVariance } from "./rolling-step-variance.js";

test("RollingStepVarianceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_024_155);
  const items: RollingStepVariance[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newRollingStepVariance(`rolling-step-variance-${index}`, "sample"));
  }
  const report = buildRollingStepVarianceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
