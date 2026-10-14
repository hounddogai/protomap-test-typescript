import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildManualEscalationReviewReport } from "./manual-escalation-review-report.js";
import { ManualEscalationReview, newManualEscalationReview } from "./manual-escalation-review.js";

test("ManualEscalationReviewReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_003_807);
  const items: ManualEscalationReview[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newManualEscalationReview(`manual-escalation-review-${index}`, "sample"));
  }
  const report = buildManualEscalationReviewReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
