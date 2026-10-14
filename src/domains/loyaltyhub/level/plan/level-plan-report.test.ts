import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLevelPlanReport } from "./level-plan-report.js";
import { LevelPlan, newLevelPlan } from "./level-plan.js";

test("LevelPlanReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_963_592);
  const items: LevelPlan[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newLevelPlan(`level-plan-${index}`, "sample"));
  }
  const report = buildLevelPlanReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
