import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildEscalationReviewReport } from "./escalation-review-report.js";
import { EscalationReview, newEscalationReview } from "./escalation-review.js";

test("EscalationReviewReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_821_071);
  const items: EscalationReview[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newEscalationReview(`escalation-review-${index}`, "sample"));
  }
  const report = buildEscalationReviewReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
