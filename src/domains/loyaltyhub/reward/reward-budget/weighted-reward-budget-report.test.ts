import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWeightedRewardBudgetReport } from "./weighted-reward-budget-report.js";
import { WeightedRewardBudget, newWeightedRewardBudget } from "./weighted-reward-budget.js";

test("WeightedRewardBudgetReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_772_294);
  const items: WeightedRewardBudget[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newWeightedRewardBudget(`weighted-reward-budget-${index}`, "sample"));
  }
  const report = buildWeightedRewardBudgetReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
