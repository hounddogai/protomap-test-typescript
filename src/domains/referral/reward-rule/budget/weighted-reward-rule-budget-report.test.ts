import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWeightedRewardRuleBudgetReport } from "./weighted-reward-rule-budget-report.js";
import { WeightedRewardRuleBudget, newWeightedRewardRuleBudget } from "./weighted-reward-rule-budget.js";

test("WeightedRewardRuleBudgetReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_350_899);
  const items: WeightedRewardRuleBudget[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newWeightedRewardRuleBudget(`weighted-reward-rule-budget-${index}`, "sample"));
  }
  const report = buildWeightedRewardRuleBudgetReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
