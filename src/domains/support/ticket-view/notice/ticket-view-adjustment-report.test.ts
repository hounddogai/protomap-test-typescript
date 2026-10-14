import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTicketViewAdjustmentReport } from "./ticket-view-adjustment-report.js";
import { TicketViewAdjustment, newTicketViewAdjustment } from "./ticket-view-adjustment.js";

test("TicketViewAdjustmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_091_543);
  const items: TicketViewAdjustment[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newTicketViewAdjustment(`ticket-view-adjustment-${index}`, "sample"));
  }
  const report = buildTicketViewAdjustmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
