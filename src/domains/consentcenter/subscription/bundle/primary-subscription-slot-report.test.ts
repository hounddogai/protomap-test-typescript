import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPrimarySubscriptionSlotReport } from "./primary-subscription-slot-report.js";
import { PrimarySubscriptionSlot, newPrimarySubscriptionSlot } from "./primary-subscription-slot.js";

test("PrimarySubscriptionSlotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_505_976);
  const items: PrimarySubscriptionSlot[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newPrimarySubscriptionSlot(`primary-subscription-slot-${index}`, "sample"));
  }
  const report = buildPrimarySubscriptionSlotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
