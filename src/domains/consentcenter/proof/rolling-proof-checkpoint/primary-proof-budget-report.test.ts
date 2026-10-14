import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPrimaryProofBudgetReport } from "./primary-proof-budget-report.js";
import { PrimaryProofBudget, newPrimaryProofBudget } from "./primary-proof-budget.js";

test("PrimaryProofBudgetReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_459_950);
  const items: PrimaryProofBudget[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newPrimaryProofBudget(`primary-proof-budget-${index}`, "sample"));
  }
  const report = buildPrimaryProofBudgetReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
