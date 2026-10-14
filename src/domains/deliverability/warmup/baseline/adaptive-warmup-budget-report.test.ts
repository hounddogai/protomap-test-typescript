import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildAdaptiveWarmupBudgetReport } from "./adaptive-warmup-budget-report.js";
import { AdaptiveWarmupBudget, newAdaptiveWarmupBudget } from "./adaptive-warmup-budget.js";

test("AdaptiveWarmupBudgetReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_689_045);
  const items: AdaptiveWarmupBudget[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newAdaptiveWarmupBudget(`adaptive-warmup-budget-${index}`, "sample"));
  }
  const report = buildAdaptiveWarmupBudgetReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
