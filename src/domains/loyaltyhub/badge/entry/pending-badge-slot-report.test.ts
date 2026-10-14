import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPendingBadgeSlotReport } from "./pending-badge-slot-report.js";
import { PendingBadgeSlot, newPendingBadgeSlot } from "./pending-badge-slot.js";

test("PendingBadgeSlotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_452_817);
  const items: PendingBadgeSlot[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newPendingBadgeSlot(`pending-badge-slot-${index}`, "sample"));
  }
  const report = buildPendingBadgeSlotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
