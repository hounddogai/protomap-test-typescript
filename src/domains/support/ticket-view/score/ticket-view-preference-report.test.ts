import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTicketViewPreferenceReport } from "./ticket-view-preference-report.js";
import { TicketViewPreference, newTicketViewPreference } from "./ticket-view-preference.js";

test("TicketViewPreferenceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_518_852);
  const items: TicketViewPreference[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newTicketViewPreference(`ticket-view-preference-${index}`, "sample"));
  }
  const report = buildTicketViewPreferenceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
