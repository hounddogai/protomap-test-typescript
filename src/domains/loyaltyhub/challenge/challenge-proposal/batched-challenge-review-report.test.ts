import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedChallengeReviewReport } from "./batched-challenge-review-report.js";
import { BatchedChallengeReview, newBatchedChallengeReview } from "./batched-challenge-review.js";

test("BatchedChallengeReviewReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_846_436);
  const items: BatchedChallengeReview[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newBatchedChallengeReview(`batched-challenge-review-${index}`, "sample"));
  }
  const report = buildBatchedChallengeReviewReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
