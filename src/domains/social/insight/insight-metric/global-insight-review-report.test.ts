import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildGlobalInsightReviewReport } from "./global-insight-review-report.js";
import { GlobalInsightReview, newGlobalInsightReview } from "./global-insight-review.js";

test("GlobalInsightReviewReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_255_034);
  const items: GlobalInsightReview[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newGlobalInsightReview(`global-insight-review-${index}`, "sample"));
  }
  const report = buildGlobalInsightReviewReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
