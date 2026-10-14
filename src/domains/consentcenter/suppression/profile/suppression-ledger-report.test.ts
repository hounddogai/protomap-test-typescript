import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSuppressionLedgerReport } from "./suppression-ledger-report.js";
import { SuppressionLedger, newSuppressionLedger } from "./suppression-ledger.js";

test("SuppressionLedgerReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_889_538);
  const items: SuppressionLedger[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newSuppressionLedger(`suppression-ledger-${index}`, "sample"));
  }
  const report = buildSuppressionLedgerReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
