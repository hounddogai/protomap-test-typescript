import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStrictBidRuleSlotReport } from "./strict-bid-rule-slot-report.js";
import { StrictBidRuleSlot, newStrictBidRuleSlot } from "./strict-bid-rule-slot.js";

test("StrictBidRuleSlotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_437_276);
  const items: StrictBidRuleSlot[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newStrictBidRuleSlot(`strict-bid-rule-slot-${index}`, "sample"));
  }
  const report = buildStrictBidRuleSlotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
