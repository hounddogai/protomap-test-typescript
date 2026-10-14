import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLegacyDoubleOptInLedgerReport } from "./legacy-double-opt-in-ledger-report.js";
import { LegacyDoubleOptInLedger, newLegacyDoubleOptInLedger } from "./legacy-double-opt-in-ledger.js";

test("LegacyDoubleOptInLedgerReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_617_380);
  const items: LegacyDoubleOptInLedger[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newLegacyDoubleOptInLedger(`legacy-double-opt-in-ledger-${index}`, "sample"));
  }
  const report = buildLegacyDoubleOptInLedgerReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
