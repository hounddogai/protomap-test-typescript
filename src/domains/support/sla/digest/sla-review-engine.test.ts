import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSlaReviewEngine } from "./sla-review-engine.js";
import { newSlaReview } from "./sla-review.js";

test("SlaReviewEngine keeps results within bounds", () => {
  const engine = defaultSlaReviewEngine();
  const item = newSlaReview("code-159", "label-951");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
