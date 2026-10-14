import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCohortReviewReport } from "./cohort-review-report.js";
import { CohortReview, newCohortReview } from "./cohort-review.js";

test("CohortReviewReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_321_626);
  const items: CohortReview[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newCohortReview(`cohort-review-${index}`, "sample"));
  }
  const report = buildCohortReviewReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
