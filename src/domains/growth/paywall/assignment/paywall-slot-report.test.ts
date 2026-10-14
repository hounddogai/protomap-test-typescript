import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPaywallSlotReport } from "./paywall-slot-report.js";
import { PaywallSlot, newPaywallSlot } from "./paywall-slot.js";

test("PaywallSlotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_961_334);
  const items: PaywallSlot[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newPaywallSlot(`paywall-slot-${index}`, "sample"));
  }
  const report = buildPaywallSlotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
