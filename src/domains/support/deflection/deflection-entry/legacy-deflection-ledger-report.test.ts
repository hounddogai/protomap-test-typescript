import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLegacyDeflectionLedgerReport } from "./legacy-deflection-ledger-report.js";
import { LegacyDeflectionLedger, newLegacyDeflectionLedger } from "./legacy-deflection-ledger.js";

test("LegacyDeflectionLedgerReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_448_386);
  const items: LegacyDeflectionLedger[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newLegacyDeflectionLedger(`legacy-deflection-ledger-${index}`, "sample"));
  }
  const report = buildLegacyDeflectionLedgerReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
