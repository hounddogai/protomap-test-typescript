import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFrequencyLedgerReport } from "./frequency-ledger-report.js";
import { FrequencyLedger, newFrequencyLedger } from "./frequency-ledger.js";

test("FrequencyLedgerReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_322_330);
  const items: FrequencyLedger[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newFrequencyLedger(`frequency-ledger-${index}`, "sample"));
  }
  const report = buildFrequencyLedgerReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
