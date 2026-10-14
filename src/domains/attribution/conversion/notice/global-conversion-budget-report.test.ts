import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildGlobalConversionBudgetReport } from "./global-conversion-budget-report.js";
import { GlobalConversionBudget, newGlobalConversionBudget } from "./global-conversion-budget.js";

test("GlobalConversionBudgetReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_750_887);
  const items: GlobalConversionBudget[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newGlobalConversionBudget(`global-conversion-budget-${index}`, "sample"));
  }
  const report = buildGlobalConversionBudgetReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
