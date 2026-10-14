import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedApprovalReviewReport } from "./batched-approval-review-report.js";
import { BatchedApprovalReview, newBatchedApprovalReview } from "./batched-approval-review.js";

test("BatchedApprovalReviewReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_885_251);
  const items: BatchedApprovalReview[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newBatchedApprovalReview(`batched-approval-review-${index}`, "sample"));
  }
  const report = buildBatchedApprovalReviewReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
