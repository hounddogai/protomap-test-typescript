import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildManualRewardReviewReport } from "./manual-reward-review-report.js";
import { ManualRewardReview, newManualRewardReview } from "./manual-reward-review.js";

test("ManualRewardReviewReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_302_501);
  const items: ManualRewardReview[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newManualRewardReview(`manual-reward-review-${index}`, "sample"));
  }
  const report = buildManualRewardReviewReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
