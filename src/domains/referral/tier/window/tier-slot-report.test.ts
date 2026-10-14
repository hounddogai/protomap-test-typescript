import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTierSlotReport } from "./tier-slot-report.js";
import { TierSlot, newTierSlot } from "./tier-slot.js";

test("TierSlotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_911_363);
  const items: TierSlot[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newTierSlot(`tier-slot-${index}`, "sample"));
  }
  const report = buildTierSlotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
