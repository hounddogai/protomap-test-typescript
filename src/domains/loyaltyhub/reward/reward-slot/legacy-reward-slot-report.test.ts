import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLegacyRewardSlotReport } from "./legacy-reward-slot-report.js";
import { LegacyRewardSlot, newLegacyRewardSlot } from "./legacy-reward-slot.js";

test("LegacyRewardSlotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_654_501);
  const items: LegacyRewardSlot[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newLegacyRewardSlot(`legacy-reward-slot-${index}`, "sample"));
  }
  const report = buildLegacyRewardSlotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
