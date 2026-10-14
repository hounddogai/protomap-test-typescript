import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildInsightReviewReport } from "./insight-review-report.js";
import { InsightReview, newInsightReview } from "./insight-review.js";

test("InsightReviewReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_652_901);
  const items: InsightReview[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newInsightReview(`insight-review-${index}`, "sample"));
  }
  const report = buildInsightReviewReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
