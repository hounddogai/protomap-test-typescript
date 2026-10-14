import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTieredRewardSlotReport } from "./tiered-reward-slot-report.js";
import { TieredRewardSlot, newTieredRewardSlot } from "./tiered-reward-slot.js";

test("TieredRewardSlotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_164_304);
  const items: TieredRewardSlot[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newTieredRewardSlot(`tiered-reward-slot-${index}`, "sample"));
  }
  const report = buildTieredRewardSlotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
