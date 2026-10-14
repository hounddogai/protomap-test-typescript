import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStepAllocationReport } from "./step-allocation-report.js";
import { StepAllocation, newStepAllocation } from "./step-allocation.js";

test("StepAllocationReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_861_545);
  const items: StepAllocation[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newStepAllocation(`step-allocation-${index}`, "sample"));
  }
  const report = buildStepAllocationReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
