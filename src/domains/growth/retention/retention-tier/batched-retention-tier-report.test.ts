import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedRetentionTierReport } from "./batched-retention-tier-report.js";
import { BatchedRetentionTier, newBatchedRetentionTier } from "./batched-retention-tier.js";

test("BatchedRetentionTierReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_063_852);
  const items: BatchedRetentionTier[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newBatchedRetentionTier(`batched-retention-tier-${index}`, "sample"));
  }
  const report = buildBatchedRetentionTierReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
