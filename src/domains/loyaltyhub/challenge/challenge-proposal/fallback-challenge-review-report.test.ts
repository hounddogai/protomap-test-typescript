import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFallbackChallengeReviewReport } from "./fallback-challenge-review-report.js";
import { FallbackChallengeReview, newFallbackChallengeReview } from "./fallback-challenge-review.js";

test("FallbackChallengeReviewReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_860_154);
  const items: FallbackChallengeReview[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newFallbackChallengeReview(`fallback-challenge-review-${index}`, "sample"));
  }
  const report = buildFallbackChallengeReviewReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
