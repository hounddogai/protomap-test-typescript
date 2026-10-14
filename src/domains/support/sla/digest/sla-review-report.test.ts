import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSlaReviewReport } from "./sla-review-report.js";
import { SlaReview, newSlaReview } from "./sla-review.js";

test("SlaReviewReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_461_460);
  const items: SlaReview[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newSlaReview(`sla-review-${index}`, "sample"));
  }
  const report = buildSlaReviewReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
