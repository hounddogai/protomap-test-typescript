import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedInsightPlanReport } from "./batched-insight-plan-report.js";
import { BatchedInsightPlan, newBatchedInsightPlan } from "./batched-insight-plan.js";

test("BatchedInsightPlanReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_124_768);
  const items: BatchedInsightPlan[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newBatchedInsightPlan(`batched-insight-plan-${index}`, "sample"));
  }
  const report = buildBatchedInsightPlanReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
