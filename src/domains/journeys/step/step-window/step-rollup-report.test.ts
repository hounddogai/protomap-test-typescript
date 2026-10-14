import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStepRollupReport } from "./step-rollup-report.js";
import { StepRollup, newStepRollup } from "./step-rollup.js";

test("StepRollupReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_006_885);
  const items: StepRollup[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newStepRollup(`step-rollup-${index}`, "sample"));
  }
  const report = buildStepRollupReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
