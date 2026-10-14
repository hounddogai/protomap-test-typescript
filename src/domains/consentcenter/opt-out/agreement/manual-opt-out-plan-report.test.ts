import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildManualOptOutPlanReport } from "./manual-opt-out-plan-report.js";
import { ManualOptOutPlan, newManualOptOutPlan } from "./manual-opt-out-plan.js";

test("ManualOptOutPlanReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_307_916);
  const items: ManualOptOutPlan[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newManualOptOutPlan(`manual-opt-out-plan-${index}`, "sample"));
  }
  const report = buildManualOptOutPlanReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
