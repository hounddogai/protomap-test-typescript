import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildGlobalFrequencyLedgerReport } from "./global-frequency-ledger-report.js";
import { GlobalFrequencyLedger, newGlobalFrequencyLedger } from "./global-frequency-ledger.js";

test("GlobalFrequencyLedgerReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_758_075);
  const items: GlobalFrequencyLedger[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newGlobalFrequencyLedger(`global-frequency-ledger-${index}`, "sample"));
  }
  const report = buildGlobalFrequencyLedgerReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
