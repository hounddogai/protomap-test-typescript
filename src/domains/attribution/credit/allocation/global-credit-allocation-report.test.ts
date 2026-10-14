import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildGlobalCreditAllocationReport } from "./global-credit-allocation-report.js";
import { GlobalCreditAllocation, newGlobalCreditAllocation } from "./global-credit-allocation.js";

test("GlobalCreditAllocationReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_353_783);
  const items: GlobalCreditAllocation[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newGlobalCreditAllocation(`global-credit-allocation-${index}`, "sample"));
  }
  const report = buildGlobalCreditAllocationReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
