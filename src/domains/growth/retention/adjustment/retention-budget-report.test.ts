import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRetentionBudgetReport } from "./retention-budget-report.js";
import { RetentionBudget, newRetentionBudget } from "./retention-budget.js";

test("RetentionBudgetReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_877_230);
  const items: RetentionBudget[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newRetentionBudget(`retention-budget-${index}`, "sample"));
  }
  const report = buildRetentionBudgetReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
