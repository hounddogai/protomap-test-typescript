import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTicketViewThresholdReport } from "./ticket-view-threshold-report.js";
import { TicketViewThreshold, newTicketViewThreshold } from "./ticket-view-threshold.js";

test("TicketViewThresholdReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_105_406);
  const items: TicketViewThreshold[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newTicketViewThreshold(`ticket-view-threshold-${index}`, "sample"));
  }
  const report = buildTicketViewThresholdReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
