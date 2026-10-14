import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPacingBudgetReport } from "./pacing-budget-report.js";
import { PacingBudget, newPacingBudget } from "./pacing-budget.js";

test("PacingBudgetReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_832_018);
  const items: PacingBudget[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newPacingBudget(`pacing-budget-${index}`, "sample"));
  }
  const report = buildPacingBudgetReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
