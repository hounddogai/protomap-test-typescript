import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLegacyTicketViewSummaryReport } from "./legacy-ticket-view-summary-report.js";
import { LegacyTicketViewSummary, newLegacyTicketViewSummary } from "./legacy-ticket-view-summary.js";

test("LegacyTicketViewSummaryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_492_335);
  const items: LegacyTicketViewSummary[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newLegacyTicketViewSummary(`legacy-ticket-view-summary-${index}`, "sample"));
  }
  const report = buildLegacyTicketViewSummaryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
