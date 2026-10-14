import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLegacyTicketViewCycleReport } from "./legacy-ticket-view-cycle-report.js";
import { LegacyTicketViewCycle, newLegacyTicketViewCycle } from "./legacy-ticket-view-cycle.js";

test("LegacyTicketViewCycleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_629_216);
  const items: LegacyTicketViewCycle[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newLegacyTicketViewCycle(`legacy-ticket-view-cycle-${index}`, "sample"));
  }
  const report = buildLegacyTicketViewCycleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
