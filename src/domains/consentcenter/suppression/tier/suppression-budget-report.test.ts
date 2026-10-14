import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSuppressionBudgetReport } from "./suppression-budget-report.js";
import { SuppressionBudget, newSuppressionBudget } from "./suppression-budget.js";

test("SuppressionBudgetReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_768_292);
  const items: SuppressionBudget[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newSuppressionBudget(`suppression-budget-${index}`, "sample"));
  }
  const report = buildSuppressionBudgetReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
