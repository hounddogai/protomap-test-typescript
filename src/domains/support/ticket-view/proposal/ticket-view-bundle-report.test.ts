import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTicketViewBundleReport } from "./ticket-view-bundle-report.js";
import { TicketViewBundle, newTicketViewBundle } from "./ticket-view-bundle.js";

test("TicketViewBundleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_285_947);
  const items: TicketViewBundle[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newTicketViewBundle(`ticket-view-bundle-${index}`, "sample"));
  }
  const report = buildTicketViewBundleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
