import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLegacyDomainLedgerReport } from "./legacy-domain-ledger-report.js";
import { LegacyDomainLedger, newLegacyDomainLedger } from "./legacy-domain-ledger.js";

test("LegacyDomainLedgerReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_484_042);
  const items: LegacyDomainLedger[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newLegacyDomainLedger(`legacy-domain-ledger-${index}`, "sample"));
  }
  const report = buildLegacyDomainLedgerReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
