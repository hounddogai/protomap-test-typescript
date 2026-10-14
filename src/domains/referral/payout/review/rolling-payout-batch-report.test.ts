import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRollingPayoutBatchReport } from "./rolling-payout-batch-report.js";
import { RollingPayoutBatch, newRollingPayoutBatch } from "./rolling-payout-batch.js";

test("RollingPayoutBatchReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_042_581);
  const items: RollingPayoutBatch[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newRollingPayoutBatch(`rolling-payout-batch-${index}`, "sample"));
  }
  const report = buildRollingPayoutBatchReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
