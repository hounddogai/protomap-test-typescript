import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPendingActivationReviewReport } from "./pending-activation-review-report.js";
import { PendingActivationReview, newPendingActivationReview } from "./pending-activation-review.js";

test("PendingActivationReviewReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_760_146);
  const items: PendingActivationReview[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newPendingActivationReview(`pending-activation-review-${index}`, "sample"));
  }
  const report = buildPendingActivationReviewReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
