import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultStrictFunnelReviewEngine } from "./strict-funnel-review-engine.js";
import { newStrictFunnelReview } from "./strict-funnel-review.js";

test("StrictFunnelReviewEngine keeps results within bounds", () => {
  const engine = defaultStrictFunnelReviewEngine();
  const item = newStrictFunnelReview("code-502", "title-961");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
