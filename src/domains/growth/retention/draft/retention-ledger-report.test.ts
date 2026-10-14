import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRetentionLedgerReport } from "./retention-ledger-report.js";
import { RetentionLedger, newRetentionLedger } from "./retention-ledger.js";

test("RetentionLedgerReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_566_698);
  const items: RetentionLedger[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newRetentionLedger(`retention-ledger-${index}`, "sample"));
  }
  const report = buildRetentionLedgerReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
