import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPendingCohortBudgetReport } from "./pending-cohort-budget-report.js";
import { PendingCohortBudget, newPendingCohortBudget } from "./pending-cohort-budget.js";

test("PendingCohortBudgetReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_758_335);
  const items: PendingCohortBudget[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newPendingCohortBudget(`pending-cohort-budget-${index}`, "sample"));
  }
  const report = buildPendingCohortBudgetReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
