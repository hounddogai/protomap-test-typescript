import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCappedStepVarianceReport } from "./capped-step-variance-report.js";
import { CappedStepVariance, newCappedStepVariance } from "./capped-step-variance.js";

test("CappedStepVarianceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_864_663);
  const items: CappedStepVariance[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newCappedStepVariance(`capped-step-variance-${index}`, "sample"));
  }
  const report = buildCappedStepVarianceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
