import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRollingCreativeReviewReport } from "./rolling-creative-review-report.js";
import { RollingCreativeReview, newRollingCreativeReview } from "./rolling-creative-review.js";

test("RollingCreativeReviewReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_547_134);
  const items: RollingCreativeReview[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newRollingCreativeReview(`rolling-creative-review-${index}`, "sample"));
  }
  const report = buildRollingCreativeReviewReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
