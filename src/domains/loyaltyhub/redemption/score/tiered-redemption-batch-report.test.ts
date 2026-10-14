import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTieredRedemptionBatchReport } from "./tiered-redemption-batch-report.js";
import { TieredRedemptionBatch, newTieredRedemptionBatch } from "./tiered-redemption-batch.js";

test("TieredRedemptionBatchReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_397_696);
  const items: TieredRedemptionBatch[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newTieredRedemptionBatch(`tiered-redemption-batch-${index}`, "sample"));
  }
  const report = buildTieredRedemptionBatchReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
