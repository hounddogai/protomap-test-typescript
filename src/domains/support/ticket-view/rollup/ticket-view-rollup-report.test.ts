import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTicketViewRollupReport } from "./ticket-view-rollup-report.js";
import { TicketViewRollup, newTicketViewRollup } from "./ticket-view-rollup.js";

test("TicketViewRollupReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_340_393);
  const items: TicketViewRollup[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newTicketViewRollup(`ticket-view-rollup-${index}`, "sample"));
  }
  const report = buildTicketViewRollupReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
