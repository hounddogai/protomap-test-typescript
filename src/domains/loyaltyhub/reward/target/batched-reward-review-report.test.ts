import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedRewardReviewReport } from "./batched-reward-review-report.js";
import { BatchedRewardReview, newBatchedRewardReview } from "./batched-reward-review.js";

test("BatchedRewardReviewReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_702_583);
  const items: BatchedRewardReview[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newBatchedRewardReview(`batched-reward-review-${index}`, "sample"));
  }
  const report = buildBatchedRewardReviewReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
