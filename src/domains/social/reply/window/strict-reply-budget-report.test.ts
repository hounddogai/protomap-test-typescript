import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStrictReplyBudgetReport } from "./strict-reply-budget-report.js";
import { StrictReplyBudget, newStrictReplyBudget } from "./strict-reply-budget.js";

test("StrictReplyBudgetReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_142_946);
  const items: StrictReplyBudget[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newStrictReplyBudget(`strict-reply-budget-${index}`, "sample"));
  }
  const report = buildStrictReplyBudgetReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
