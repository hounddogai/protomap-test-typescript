import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRegionalBounceBudgetReport } from "./regional-bounce-budget-report.js";
import { RegionalBounceBudget, newRegionalBounceBudget } from "./regional-bounce-budget.js";

test("RegionalBounceBudgetReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_369_523);
  const items: RegionalBounceBudget[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newRegionalBounceBudget(`regional-bounce-budget-${index}`, "sample"));
  }
  const report = buildRegionalBounceBudgetReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
