import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStepBaselineReport } from "./step-baseline-report.js";
import { StepBaseline, newStepBaseline } from "./step-baseline.js";

test("StepBaselineReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_077_666);
  const items: StepBaseline[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newStepBaseline(`step-baseline-${index}`, "sample"));
  }
  const report = buildStepBaselineReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
