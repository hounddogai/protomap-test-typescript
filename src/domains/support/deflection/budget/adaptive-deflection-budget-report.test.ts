import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildAdaptiveDeflectionBudgetReport } from "./adaptive-deflection-budget-report.js";
import { AdaptiveDeflectionBudget, newAdaptiveDeflectionBudget } from "./adaptive-deflection-budget.js";

test("AdaptiveDeflectionBudgetReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_302_118);
  const items: AdaptiveDeflectionBudget[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newAdaptiveDeflectionBudget(`adaptive-deflection-budget-${index}`, "sample"));
  }
  const report = buildAdaptiveDeflectionBudgetReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
