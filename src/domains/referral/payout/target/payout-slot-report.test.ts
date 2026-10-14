import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPayoutSlotReport } from "./payout-slot-report.js";
import { PayoutSlot, newPayoutSlot } from "./payout-slot.js";

test("PayoutSlotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_685_835);
  const items: PayoutSlot[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newPayoutSlot(`payout-slot-${index}`, "sample"));
  }
  const report = buildPayoutSlotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
