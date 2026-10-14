import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildAdaptiveSenderReviewReport } from "./adaptive-sender-review-report.js";
import { AdaptiveSenderReview, newAdaptiveSenderReview } from "./adaptive-sender-review.js";

test("AdaptiveSenderReviewReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_904_947);
  const items: AdaptiveSenderReview[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newAdaptiveSenderReview(`adaptive-sender-review-${index}`, "sample"));
  }
  const report = buildAdaptiveSenderReviewReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
