import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDefaultRewardRuleBudgetReport } from "./default-reward-rule-budget-report.js";
import { DefaultRewardRuleBudget, newDefaultRewardRuleBudget } from "./default-reward-rule-budget.js";

test("DefaultRewardRuleBudgetReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_567_523);
  const items: DefaultRewardRuleBudget[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newDefaultRewardRuleBudget(`default-reward-rule-budget-${index}`, "sample"));
  }
  const report = buildDefaultRewardRuleBudgetReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
