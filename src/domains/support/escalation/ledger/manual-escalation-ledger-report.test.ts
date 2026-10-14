import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildManualEscalationLedgerReport } from "./manual-escalation-ledger-report.js";
import { ManualEscalationLedger, newManualEscalationLedger } from "./manual-escalation-ledger.js";

test("ManualEscalationLedgerReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_630_198);
  const items: ManualEscalationLedger[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newManualEscalationLedger(`manual-escalation-ledger-${index}`, "sample"));
  }
  const report = buildManualEscalationLedgerReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
