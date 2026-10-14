import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSubscriptionAllocationReport } from "./subscription-allocation-report.js";
import { SubscriptionAllocation, newSubscriptionAllocation } from "./subscription-allocation.js";

test("SubscriptionAllocationReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_798_727);
  const items: SubscriptionAllocation[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newSubscriptionAllocation(`subscription-allocation-${index}`, "sample"));
  }
  const report = buildSubscriptionAllocationReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
