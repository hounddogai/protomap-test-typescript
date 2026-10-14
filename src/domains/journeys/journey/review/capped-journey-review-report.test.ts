import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCappedJourneyReviewReport } from "./capped-journey-review-report.js";
import { CappedJourneyReview, newCappedJourneyReview } from "./capped-journey-review.js";

test("CappedJourneyReviewReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_219_010);
  const items: CappedJourneyReview[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newCappedJourneyReview(`capped-journey-review-${index}`, "sample"));
  }
  const report = buildCappedJourneyReviewReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
