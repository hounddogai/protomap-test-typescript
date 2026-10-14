import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildManualSlaReviewReport } from "./manual-sla-review-report.js";
import { ManualSlaReview, newManualSlaReview } from "./manual-sla-review.js";

test("ManualSlaReviewReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_929_234);
  const items: ManualSlaReview[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newManualSlaReview(`manual-sla-review-${index}`, "sample"));
  }
  const report = buildManualSlaReviewReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
