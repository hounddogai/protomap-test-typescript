import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultConversionReviewEngine } from "./conversion-review-engine.js";
import { newConversionReview } from "./conversion-review.js";

test("ConversionReviewEngine keeps results within bounds", () => {
  const engine = defaultConversionReviewEngine();
  const item = newConversionReview("code-524", "label-68");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
