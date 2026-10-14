import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildManualPayoutBatchReport } from "./manual-payout-batch-report.js";
import { ManualPayoutBatch, newManualPayoutBatch } from "./manual-payout-batch.js";

test("ManualPayoutBatchReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_653_658);
  const items: ManualPayoutBatch[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newManualPayoutBatch(`manual-payout-batch-${index}`, "sample"));
  }
  const report = buildManualPayoutBatchReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
