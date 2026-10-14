import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildOptOutLedgerReport } from "./opt-out-ledger-report.js";
import { OptOutLedger, newOptOutLedger } from "./opt-out-ledger.js";

test("OptOutLedgerReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_030_933);
  const items: OptOutLedger[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newOptOutLedger(`opt-out-ledger-${index}`, "sample"));
  }
  const report = buildOptOutLedgerReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
