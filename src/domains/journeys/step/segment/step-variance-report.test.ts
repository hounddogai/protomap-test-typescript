import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStepVarianceReport } from "./step-variance-report.js";
import { StepVariance, newStepVariance } from "./step-variance.js";

test("StepVarianceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_253_540);
  const items: StepVariance[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newStepVariance(`step-variance-${index}`, "sample"));
  }
  const report = buildStepVarianceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
