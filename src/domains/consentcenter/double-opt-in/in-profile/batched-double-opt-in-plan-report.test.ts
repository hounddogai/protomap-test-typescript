import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedDoubleOptInPlanReport } from "./batched-double-opt-in-plan-report.js";
import { BatchedDoubleOptInPlan, newBatchedDoubleOptInPlan } from "./batched-double-opt-in-plan.js";

test("BatchedDoubleOptInPlanReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_211_063);
  const items: BatchedDoubleOptInPlan[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newBatchedDoubleOptInPlan(`batched-double-opt-in-plan-${index}`, "sample"));
  }
  const report = buildBatchedDoubleOptInPlanReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
