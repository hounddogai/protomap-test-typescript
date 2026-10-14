import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLegacySubscriptionSlotReport } from "./legacy-subscription-slot-report.js";
import { LegacySubscriptionSlot, newLegacySubscriptionSlot } from "./legacy-subscription-slot.js";

test("LegacySubscriptionSlotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_536_636);
  const items: LegacySubscriptionSlot[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newLegacySubscriptionSlot(`legacy-subscription-slot-${index}`, "sample"));
  }
  const report = buildLegacySubscriptionSlotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
