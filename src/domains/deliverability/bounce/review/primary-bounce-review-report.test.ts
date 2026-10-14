import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPrimaryBounceReviewReport } from "./primary-bounce-review-report.js";
import { PrimaryBounceReview, newPrimaryBounceReview } from "./primary-bounce-review.js";

test("PrimaryBounceReviewReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_596_779);
  const items: PrimaryBounceReview[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newPrimaryBounceReview(`primary-bounce-review-${index}`, "sample"));
  }
  const report = buildPrimaryBounceReviewReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
