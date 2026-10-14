import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLenientReputationReviewReport } from "./lenient-reputation-review-report.js";
import { LenientReputationReview, newLenientReputationReview } from "./lenient-reputation-review.js";

test("LenientReputationReviewReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_913_361);
  const items: LenientReputationReview[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newLenientReputationReview(`lenient-reputation-review-${index}`, "sample"));
  }
  const report = buildLenientReputationReviewReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
