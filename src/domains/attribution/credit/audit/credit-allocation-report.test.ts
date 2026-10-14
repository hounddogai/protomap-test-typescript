import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCreditAllocationReport } from "./credit-allocation-report.js";
import { CreditAllocation, newCreditAllocation } from "./credit-allocation.js";

test("CreditAllocationReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_363_177);
  const items: CreditAllocation[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newCreditAllocation(`credit-allocation-${index}`, "sample"));
  }
  const report = buildCreditAllocationReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
