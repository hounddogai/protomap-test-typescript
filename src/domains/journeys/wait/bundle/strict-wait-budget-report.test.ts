import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStrictWaitBudgetReport } from "./strict-wait-budget-report.js";
import { StrictWaitBudget, newStrictWaitBudget } from "./strict-wait-budget.js";

test("StrictWaitBudgetReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_108_511);
  const items: StrictWaitBudget[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newStrictWaitBudget(`strict-wait-budget-${index}`, "sample"));
  }
  const report = buildStrictWaitBudgetReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
