import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCappedFrequencyReviewReport } from "./capped-frequency-review-report.js";
import { CappedFrequencyReview, newCappedFrequencyReview } from "./capped-frequency-review.js";

test("CappedFrequencyReviewReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_353_309);
  const items: CappedFrequencyReview[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newCappedFrequencyReview(`capped-frequency-review-${index}`, "sample"));
  }
  const report = buildCappedFrequencyReviewReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
