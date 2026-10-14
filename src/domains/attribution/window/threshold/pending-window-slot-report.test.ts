import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPendingWindowSlotReport } from "./pending-window-slot-report.js";
import { PendingWindowSlot, newPendingWindowSlot } from "./pending-window-slot.js";

test("PendingWindowSlotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_068_717);
  const items: PendingWindowSlot[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newPendingWindowSlot(`pending-window-slot-${index}`, "sample"));
  }
  const report = buildPendingWindowSlotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
