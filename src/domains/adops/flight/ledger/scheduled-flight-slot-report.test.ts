import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildScheduledFlightSlotReport } from "./scheduled-flight-slot-report.js";
import { ScheduledFlightSlot, newScheduledFlightSlot } from "./scheduled-flight-slot.js";

test("ScheduledFlightSlotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_552_413);
  const items: ScheduledFlightSlot[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newScheduledFlightSlot(`scheduled-flight-slot-${index}`, "sample"));
  }
  const report = buildScheduledFlightSlotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
