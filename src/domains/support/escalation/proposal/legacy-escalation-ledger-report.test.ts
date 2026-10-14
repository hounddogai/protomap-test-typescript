import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLegacyEscalationLedgerReport } from "./legacy-escalation-ledger-report.js";
import { LegacyEscalationLedger, newLegacyEscalationLedger } from "./legacy-escalation-ledger.js";

test("LegacyEscalationLedgerReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_619_960);
  const items: LegacyEscalationLedger[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newLegacyEscalationLedger(`legacy-escalation-ledger-${index}`, "sample"));
  }
  const report = buildLegacyEscalationLedgerReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
