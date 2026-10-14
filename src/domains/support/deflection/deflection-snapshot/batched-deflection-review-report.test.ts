import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedDeflectionReviewReport } from "./batched-deflection-review-report.js";
import { BatchedDeflectionReview, newBatchedDeflectionReview } from "./batched-deflection-review.js";

test("BatchedDeflectionReviewReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_189_767);
  const items: BatchedDeflectionReview[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newBatchedDeflectionReview(`batched-deflection-review-${index}`, "sample"));
  }
  const report = buildBatchedDeflectionReviewReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
