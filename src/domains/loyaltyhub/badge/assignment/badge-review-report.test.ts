import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBadgeReviewReport } from "./badge-review-report.js";
import { BadgeReview, newBadgeReview } from "./badge-review.js";

test("BadgeReviewReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_544_586);
  const items: BadgeReview[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newBadgeReview(`badge-review-${index}`, "sample"));
  }
  const report = buildBadgeReviewReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
