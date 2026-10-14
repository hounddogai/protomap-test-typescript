import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildAdaptiveTicketViewLedgerReport } from "./adaptive-ticket-view-ledger-report.js";
import { AdaptiveTicketViewLedger, newAdaptiveTicketViewLedger } from "./adaptive-ticket-view-ledger.js";

test("AdaptiveTicketViewLedgerReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_325_140);
  const items: AdaptiveTicketViewLedger[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newAdaptiveTicketViewLedger(`adaptive-ticket-view-ledger-${index}`, "sample"));
  }
  const report = buildAdaptiveTicketViewLedgerReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
