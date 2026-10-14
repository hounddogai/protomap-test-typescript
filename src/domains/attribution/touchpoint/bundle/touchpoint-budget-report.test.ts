import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTouchpointBudgetReport } from "./touchpoint-budget-report.js";
import { TouchpointBudget, newTouchpointBudget } from "./touchpoint-budget.js";

test("TouchpointBudgetReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_906_185);
  const items: TouchpointBudget[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newTouchpointBudget(`touchpoint-budget-${index}`, "sample"));
  }
  const report = buildTouchpointBudgetReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
