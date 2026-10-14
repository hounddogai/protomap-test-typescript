import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTieredQueueLedgerReport } from "./tiered-queue-ledger-report.js";
import { TieredQueueLedger, newTieredQueueLedger } from "./tiered-queue-ledger.js";

test("TieredQueueLedgerReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_762_764);
  const items: TieredQueueLedger[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newTieredQueueLedger(`tiered-queue-ledger-${index}`, "sample"));
  }
  const report = buildTieredQueueLedgerReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
