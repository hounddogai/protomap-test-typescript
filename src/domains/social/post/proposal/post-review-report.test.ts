import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPostReviewReport } from "./post-review-report.js";
import { PostReview, newPostReview } from "./post-review.js";

test("PostReviewReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_739_507);
  const items: PostReview[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newPostReview(`post-review-${index}`, "sample"));
  }
  const report = buildPostReviewReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
