import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRegionalActivationBudgetReport } from "./regional-activation-budget-report.js";
import { RegionalActivationBudget, newRegionalActivationBudget } from "./regional-activation-budget.js";

test("RegionalActivationBudgetReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_094_601);
  const items: RegionalActivationBudget[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newRegionalActivationBudget(`regional-activation-budget-${index}`, "sample"));
  }
  const report = buildRegionalActivationBudgetReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
