import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPrimaryWarmupReviewReport } from "./primary-warmup-review-report.js";
import { PrimaryWarmupReview, newPrimaryWarmupReview } from "./primary-warmup-review.js";

test("PrimaryWarmupReviewReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_712_855);
  const items: PrimaryWarmupReview[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newPrimaryWarmupReview(`primary-warmup-review-${index}`, "sample"));
  }
  const report = buildPrimaryWarmupReviewReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
