import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTicketViewLedgerReport } from "./ticket-view-ledger-report.js";
import { TicketViewLedger, newTicketViewLedger } from "./ticket-view-ledger.js";

test("TicketViewLedgerReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_180_281);
  const items: TicketViewLedger[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newTicketViewLedger(`ticket-view-ledger-${index}`, "sample"));
  }
  const report = buildTicketViewLedgerReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
