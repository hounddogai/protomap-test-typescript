import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildGlobalWaitBudgetReport } from "./global-wait-budget-report.js";
import { GlobalWaitBudget, newGlobalWaitBudget } from "./global-wait-budget.js";

test("GlobalWaitBudgetReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_203_361);
  const items: GlobalWaitBudget[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newGlobalWaitBudget(`global-wait-budget-${index}`, "sample"));
  }
  const report = buildGlobalWaitBudgetReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
