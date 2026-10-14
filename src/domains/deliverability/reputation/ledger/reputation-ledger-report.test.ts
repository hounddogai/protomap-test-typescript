import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildReputationLedgerReport } from "./reputation-ledger-report.js";
import { ReputationLedger, newReputationLedger } from "./reputation-ledger.js";

test("ReputationLedgerReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_397_955);
  const items: ReputationLedger[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newReputationLedger(`reputation-ledger-${index}`, "sample"));
  }
  const report = buildReputationLedgerReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
