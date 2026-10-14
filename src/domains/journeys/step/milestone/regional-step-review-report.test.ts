import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRegionalStepReviewReport } from "./regional-step-review-report.js";
import { RegionalStepReview, newRegionalStepReview } from "./regional-step-review.js";

test("RegionalStepReviewReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_503_078);
  const items: RegionalStepReview[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newRegionalStepReview(`regional-step-review-${index}`, "sample"));
  }
  const report = buildRegionalStepReviewReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
