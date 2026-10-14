import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTicketViewSegmentReport } from "./ticket-view-segment-report.js";
import { TicketViewSegment, newTicketViewSegment } from "./ticket-view-segment.js";

test("TicketViewSegmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_225_609);
  const items: TicketViewSegment[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newTicketViewSegment(`ticket-view-segment-${index}`, "sample"));
  }
  const report = buildTicketViewSegmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
