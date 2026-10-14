import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTicketViewEstimateReport } from "./ticket-view-estimate-report.js";
import { TicketViewEstimate, newTicketViewEstimate } from "./ticket-view-estimate.js";

test("TicketViewEstimateReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_487_757);
  const items: TicketViewEstimate[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newTicketViewEstimate(`ticket-view-estimate-${index}`, "sample"));
  }
  const report = buildTicketViewEstimateReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
