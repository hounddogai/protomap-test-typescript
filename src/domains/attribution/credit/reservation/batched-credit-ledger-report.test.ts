import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedCreditLedgerReport } from "./batched-credit-ledger-report.js";
import { BatchedCreditLedger, newBatchedCreditLedger } from "./batched-credit-ledger.js";

test("BatchedCreditLedgerReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_852_822);
  const items: BatchedCreditLedger[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newBatchedCreditLedger(`batched-credit-ledger-${index}`, "sample"));
  }
  const report = buildBatchedCreditLedgerReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
