import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStrictSubscriptionReviewReport } from "./strict-subscription-review-report.js";
import { StrictSubscriptionReview, newStrictSubscriptionReview } from "./strict-subscription-review.js";

test("StrictSubscriptionReviewReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_517_795);
  const items: StrictSubscriptionReview[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newStrictSubscriptionReview(`strict-subscription-review-${index}`, "sample"));
  }
  const report = buildStrictSubscriptionReviewReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
