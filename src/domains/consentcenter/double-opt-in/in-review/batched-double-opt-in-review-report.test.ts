import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedDoubleOptInReviewReport } from "./batched-double-opt-in-review-report.js";
import { BatchedDoubleOptInReview, newBatchedDoubleOptInReview } from "./batched-double-opt-in-review.js";

test("BatchedDoubleOptInReviewReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_519_167);
  const items: BatchedDoubleOptInReview[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newBatchedDoubleOptInReview(`batched-double-opt-in-review-${index}`, "sample"));
  }
  const report = buildBatchedDoubleOptInReviewReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
