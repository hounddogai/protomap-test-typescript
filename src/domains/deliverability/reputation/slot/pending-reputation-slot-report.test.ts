import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPendingReputationSlotReport } from "./pending-reputation-slot-report.js";
import { PendingReputationSlot, newPendingReputationSlot } from "./pending-reputation-slot.js";

test("PendingReputationSlotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_885_142);
  const items: PendingReputationSlot[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newPendingReputationSlot(`pending-reputation-slot-${index}`, "sample"));
  }
  const report = buildPendingReputationSlotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
