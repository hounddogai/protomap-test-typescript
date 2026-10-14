import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRollingNudgeReviewReport } from "./rolling-nudge-review-report.js";
import { RollingNudgeReview, newRollingNudgeReview } from "./rolling-nudge-review.js";

test("RollingNudgeReviewReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_518_645);
  const items: RollingNudgeReview[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newRollingNudgeReview(`rolling-nudge-review-${index}`, "sample"));
  }
  const report = buildRollingNudgeReviewReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
