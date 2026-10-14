import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDefaultStreakPlanReport } from "./default-streak-plan-report.js";
import { DefaultStreakPlan, newDefaultStreakPlan } from "./default-streak-plan.js";

test("DefaultStreakPlanReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_341_185);
  const items: DefaultStreakPlan[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newDefaultStreakPlan(`default-streak-plan-${index}`, "sample"));
  }
  const report = buildDefaultStreakPlanReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
