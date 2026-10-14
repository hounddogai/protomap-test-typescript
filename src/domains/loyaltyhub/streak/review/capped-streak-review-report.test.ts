import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCappedStreakReviewReport } from "./capped-streak-review-report.js";
import { CappedStreakReview, newCappedStreakReview } from "./capped-streak-review.js";

test("CappedStreakReviewReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_397_237);
  const items: CappedStreakReview[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newCappedStreakReview(`capped-streak-review-${index}`, "sample"));
  }
  const report = buildCappedStreakReviewReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
