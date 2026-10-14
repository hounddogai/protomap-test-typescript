import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCohortBudgetReport } from "./cohort-budget-report.js";
import { CohortBudget, newCohortBudget } from "./cohort-budget.js";

test("CohortBudgetReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_928_431);
  const items: CohortBudget[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newCohortBudget(`cohort-budget-${index}`, "sample"));
  }
  const report = buildCohortBudgetReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
