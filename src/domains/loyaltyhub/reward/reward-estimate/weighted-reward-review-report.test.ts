import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWeightedRewardReviewReport } from "./weighted-reward-review-report.js";
import { WeightedRewardReview, newWeightedRewardReview } from "./weighted-reward-review.js";

test("WeightedRewardReviewReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_895_294);
  const items: WeightedRewardReview[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newWeightedRewardReview(`weighted-reward-review-${index}`, "sample"));
  }
  const report = buildWeightedRewardReviewReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
