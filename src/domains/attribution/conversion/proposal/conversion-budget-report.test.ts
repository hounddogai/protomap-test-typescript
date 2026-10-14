import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildConversionBudgetReport } from "./conversion-budget-report.js";
import { ConversionBudget, newConversionBudget } from "./conversion-budget.js";

test("ConversionBudgetReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_386_879);
  const items: ConversionBudget[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newConversionBudget(`conversion-budget-${index}`, "sample"));
  }
  const report = buildConversionBudgetReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
