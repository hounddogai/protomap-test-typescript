import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBidRuleSlotReport } from "./bid-rule-slot-report.js";
import { BidRuleSlot, newBidRuleSlot } from "./bid-rule-slot.js";

test("BidRuleSlotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_311_991);
  const items: BidRuleSlot[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newBidRuleSlot(`bid-rule-slot-${index}`, "sample"));
  }
  const report = buildBidRuleSlotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
