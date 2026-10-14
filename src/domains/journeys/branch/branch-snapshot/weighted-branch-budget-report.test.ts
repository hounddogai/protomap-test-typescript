import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWeightedBranchBudgetReport } from "./weighted-branch-budget-report.js";
import { WeightedBranchBudget, newWeightedBranchBudget } from "./weighted-branch-budget.js";

test("WeightedBranchBudgetReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_626_947);
  const items: WeightedBranchBudget[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newWeightedBranchBudget(`weighted-branch-budget-${index}`, "sample"));
  }
  const report = buildWeightedBranchBudgetReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
