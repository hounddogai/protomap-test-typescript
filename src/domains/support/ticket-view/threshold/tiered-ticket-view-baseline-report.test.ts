import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTieredTicketViewBaselineReport } from "./tiered-ticket-view-baseline-report.js";
import { TieredTicketViewBaseline, newTieredTicketViewBaseline } from "./tiered-ticket-view-baseline.js";

test("TieredTicketViewBaselineReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_330_257);
  const items: TieredTicketViewBaseline[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newTieredTicketViewBaseline(`tiered-ticket-view-baseline-${index}`, "sample"));
  }
  const report = buildTieredTicketViewBaselineReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
