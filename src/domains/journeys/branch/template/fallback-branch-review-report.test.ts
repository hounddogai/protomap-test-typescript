import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFallbackBranchReviewReport } from "./fallback-branch-review-report.js";
import { FallbackBranchReview, newFallbackBranchReview } from "./fallback-branch-review.js";

test("FallbackBranchReviewReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_903_852);
  const items: FallbackBranchReview[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newFallbackBranchReview(`fallback-branch-review-${index}`, "sample"));
  }
  const report = buildFallbackBranchReviewReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
