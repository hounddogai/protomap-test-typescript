import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedCreativeReviewReport } from "./batched-creative-review-report.js";
import { BatchedCreativeReview, newBatchedCreativeReview } from "./batched-creative-review.js";

test("BatchedCreativeReviewReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_641_993);
  const items: BatchedCreativeReview[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newBatchedCreativeReview(`batched-creative-review-${index}`, "sample"));
  }
  const report = buildBatchedCreativeReviewReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
