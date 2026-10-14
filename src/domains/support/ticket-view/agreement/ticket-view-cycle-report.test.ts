import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTicketViewCycleReport } from "./ticket-view-cycle-report.js";
import { TicketViewCycle, newTicketViewCycle } from "./ticket-view-cycle.js";

test("TicketViewCycleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_486_796);
  const items: TicketViewCycle[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newTicketViewCycle(`ticket-view-cycle-${index}`, "sample"));
  }
  const report = buildTicketViewCycleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
