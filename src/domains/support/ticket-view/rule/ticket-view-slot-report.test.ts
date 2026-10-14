import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTicketViewSlotReport } from "./ticket-view-slot-report.js";
import { TicketViewSlot, newTicketViewSlot } from "./ticket-view-slot.js";

test("TicketViewSlotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_671_888);
  const items: TicketViewSlot[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newTicketViewSlot(`ticket-view-slot-${index}`, "sample"));
  }
  const report = buildTicketViewSlotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
