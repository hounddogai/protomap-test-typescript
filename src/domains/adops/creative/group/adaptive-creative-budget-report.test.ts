import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildAdaptiveCreativeBudgetReport } from "./adaptive-creative-budget-report.js";
import { AdaptiveCreativeBudget, newAdaptiveCreativeBudget } from "./adaptive-creative-budget.js";

test("AdaptiveCreativeBudgetReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_931_722);
  const items: AdaptiveCreativeBudget[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newAdaptiveCreativeBudget(`adaptive-creative-budget-${index}`, "sample"));
  }
  const report = buildAdaptiveCreativeBudgetReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
