import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTieredRetentionBudgetReport } from "./tiered-retention-budget-report.js";
import { TieredRetentionBudget, newTieredRetentionBudget } from "./tiered-retention-budget.js";

test("TieredRetentionBudgetReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_631_454);
  const items: TieredRetentionBudget[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newTieredRetentionBudget(`tiered-retention-budget-${index}`, "sample"));
  }
  const report = buildTieredRetentionBudgetReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
