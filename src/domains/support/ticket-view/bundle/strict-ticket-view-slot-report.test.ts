import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStrictTicketViewSlotReport } from "./strict-ticket-view-slot-report.js";
import { StrictTicketViewSlot, newStrictTicketViewSlot } from "./strict-ticket-view-slot.js";

test("StrictTicketViewSlotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_216_775);
  const items: StrictTicketViewSlot[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newStrictTicketViewSlot(`strict-ticket-view-slot-${index}`, "sample"));
  }
  const report = buildStrictTicketViewSlotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
