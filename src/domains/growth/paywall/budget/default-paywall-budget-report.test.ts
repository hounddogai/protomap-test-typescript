import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDefaultPaywallBudgetReport } from "./default-paywall-budget-report.js";
import { DefaultPaywallBudget, newDefaultPaywallBudget } from "./default-paywall-budget.js";

test("DefaultPaywallBudgetReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_767_526);
  const items: DefaultPaywallBudget[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newDefaultPaywallBudget(`default-paywall-budget-${index}`, "sample"));
  }
  const report = buildDefaultPaywallBudgetReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
