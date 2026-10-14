import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStrictFrequencyReviewReport } from "./strict-frequency-review-report.js";
import { StrictFrequencyReview, newStrictFrequencyReview } from "./strict-frequency-review.js";

test("StrictFrequencyReviewReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_313_216);
  const items: StrictFrequencyReview[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newStrictFrequencyReview(`strict-frequency-review-${index}`, "sample"));
  }
  const report = buildStrictFrequencyReviewReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
