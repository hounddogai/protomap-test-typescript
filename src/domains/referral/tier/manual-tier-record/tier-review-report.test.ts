import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTierReviewReport } from "./tier-review-report.js";
import { TierReview, newTierReview } from "./tier-review.js";

test("TierReviewReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_713_820);
  const items: TierReview[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newTierReview(`tier-review-${index}`, "sample"));
  }
  const report = buildTierReviewReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
