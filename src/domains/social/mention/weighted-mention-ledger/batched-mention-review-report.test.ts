import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedMentionReviewReport } from "./batched-mention-review-report.js";
import { BatchedMentionReview, newBatchedMentionReview } from "./batched-mention-review.js";

test("BatchedMentionReviewReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_643_588);
  const items: BatchedMentionReview[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newBatchedMentionReview(`batched-mention-review-${index}`, "sample"));
  }
  const report = buildBatchedMentionReviewReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
