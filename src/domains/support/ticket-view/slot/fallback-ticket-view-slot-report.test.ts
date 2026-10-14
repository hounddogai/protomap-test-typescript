import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFallbackTicketViewSlotReport } from "./fallback-ticket-view-slot-report.js";
import { FallbackTicketViewSlot, newFallbackTicketViewSlot } from "./fallback-ticket-view-slot.js";

test("FallbackTicketViewSlotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_423_496);
  const items: FallbackTicketViewSlot[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newFallbackTicketViewSlot(`fallback-ticket-view-slot-${index}`, "sample"));
  }
  const report = buildFallbackTicketViewSlotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
