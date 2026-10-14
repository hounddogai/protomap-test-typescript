import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLegacyActivationLedgerReport } from "./legacy-activation-ledger-report.js";
import { LegacyActivationLedger, newLegacyActivationLedger } from "./legacy-activation-ledger.js";

test("LegacyActivationLedgerReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_842_093);
  const items: LegacyActivationLedger[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newLegacyActivationLedger(`legacy-activation-ledger-${index}`, "sample"));
  }
  const report = buildLegacyActivationLedgerReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
