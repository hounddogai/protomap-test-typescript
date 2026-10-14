import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedWarmupLedgerReport } from "./batched-warmup-ledger-report.js";
import { BatchedWarmupLedger, newBatchedWarmupLedger } from "./batched-warmup-ledger.js";

test("BatchedWarmupLedgerReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_599_884);
  const items: BatchedWarmupLedger[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newBatchedWarmupLedger(`batched-warmup-ledger-${index}`, "sample"));
  }
  const report = buildBatchedWarmupLedgerReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
