import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWeightedTicketViewCycleReport } from "./weighted-ticket-view-cycle-report.js";
import { WeightedTicketViewCycle, newWeightedTicketViewCycle } from "./weighted-ticket-view-cycle.js";

test("WeightedTicketViewCycleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_687_413);
  const items: WeightedTicketViewCycle[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newWeightedTicketViewCycle(`weighted-ticket-view-cycle-${index}`, "sample"));
  }
  const report = buildWeightedTicketViewCycleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
