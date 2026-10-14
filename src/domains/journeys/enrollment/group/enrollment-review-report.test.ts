import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildEnrollmentReviewReport } from "./enrollment-review-report.js";
import { EnrollmentReview, newEnrollmentReview } from "./enrollment-review.js";

test("EnrollmentReviewReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_888_469);
  const items: EnrollmentReview[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newEnrollmentReview(`enrollment-review-${index}`, "sample"));
  }
  const report = buildEnrollmentReviewReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
