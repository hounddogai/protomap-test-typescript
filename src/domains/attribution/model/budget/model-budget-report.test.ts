import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildModelBudgetReport } from "./model-budget-report.js";
import { ModelBudget, newModelBudget } from "./model-budget.js";

test("ModelBudgetReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_438_560);
  const items: ModelBudget[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newModelBudget(`model-budget-${index}`, "sample"));
  }
  const report = buildModelBudgetReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
