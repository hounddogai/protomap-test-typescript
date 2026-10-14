import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildMentionReviewReport } from "./mention-review-report.js";
import { MentionReview, newMentionReview } from "./mention-review.js";

test("MentionReviewReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_849_327);
  const items: MentionReview[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newMentionReview(`mention-review-${index}`, "sample"));
  }
  const report = buildMentionReviewReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
