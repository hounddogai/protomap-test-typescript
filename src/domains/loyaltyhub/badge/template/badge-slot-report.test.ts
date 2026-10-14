import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBadgeSlotReport } from "./badge-slot-report.js";
import { BadgeSlot, newBadgeSlot } from "./badge-slot.js";

test("BadgeSlotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_688_141);
  const items: BadgeSlot[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newBadgeSlot(`badge-slot-${index}`, "sample"));
  }
  const report = buildBadgeSlotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
