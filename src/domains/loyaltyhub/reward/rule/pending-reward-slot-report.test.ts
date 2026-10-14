import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPendingRewardSlotReport } from "./pending-reward-slot-report.js";
import { PendingRewardSlot, newPendingRewardSlot } from "./pending-reward-slot.js";

test("PendingRewardSlotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_960_455);
  const items: PendingRewardSlot[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newPendingRewardSlot(`pending-reward-slot-${index}`, "sample"));
  }
  const report = buildPendingRewardSlotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
