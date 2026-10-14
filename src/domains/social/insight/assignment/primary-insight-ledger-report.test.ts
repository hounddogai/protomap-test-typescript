import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPrimaryInsightLedgerReport } from "./primary-insight-ledger-report.js";
import { PrimaryInsightLedger, newPrimaryInsightLedger } from "./primary-insight-ledger.js";

test("PrimaryInsightLedgerReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_846_408);
  const items: PrimaryInsightLedger[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newPrimaryInsightLedger(`primary-insight-ledger-${index}`, "sample"));
  }
  const report = buildPrimaryInsightLedgerReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
