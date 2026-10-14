import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildManualBidRuleBudgetReport } from "./manual-bid-rule-budget-report.js";
import { ManualBidRuleBudget, newManualBidRuleBudget } from "./manual-bid-rule-budget.js";

test("ManualBidRuleBudgetReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_783_775);
  const items: ManualBidRuleBudget[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newManualBidRuleBudget(`manual-bid-rule-budget-${index}`, "sample"));
  }
  const report = buildManualBidRuleBudgetReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
