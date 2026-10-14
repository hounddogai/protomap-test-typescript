import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStreakPlanReport } from "./streak-plan-report.js";
import { StreakPlan, newStreakPlan } from "./streak-plan.js";

test("StreakPlanReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_691_715);
  const items: StreakPlan[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newStreakPlan(`streak-plan-${index}`, "sample"));
  }
  const report = buildStreakPlanReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
