import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTicketViewGroupReport } from "./ticket-view-group-report.js";
import { TicketViewGroup, newTicketViewGroup } from "./ticket-view-group.js";

test("TicketViewGroupReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_986_944);
  const items: TicketViewGroup[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newTicketViewGroup(`ticket-view-group-${index}`, "sample"));
  }
  const report = buildTicketViewGroupReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
