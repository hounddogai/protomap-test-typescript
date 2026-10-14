import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFallbackJourneyReviewReport } from "./fallback-journey-review-report.js";
import { FallbackJourneyReview, newFallbackJourneyReview } from "./fallback-journey-review.js";

test("FallbackJourneyReviewReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_660_856);
  const items: FallbackJourneyReview[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newFallbackJourneyReview(`fallback-journey-review-${index}`, "sample"));
  }
  const report = buildFallbackJourneyReviewReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
