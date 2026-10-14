import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTieredCohortLedgerReport } from "./tiered-cohort-ledger-report.js";
import { TieredCohortLedger, newTieredCohortLedger } from "./tiered-cohort-ledger.js";

test("TieredCohortLedgerReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_989_381);
  const items: TieredCohortLedger[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newTieredCohortLedger(`tiered-cohort-ledger-${index}`, "sample"));
  }
  const report = buildTieredCohortLedgerReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
