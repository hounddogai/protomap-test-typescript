import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLenientCsatReviewEngine } from "./lenient-csat-review-engine.js";
import { newLenientCsatReview } from "./lenient-csat-review.js";

test("LenientCsatReviewEngine keeps results within bounds", () => {
  const engine = defaultLenientCsatReviewEngine(flags.newRegistry());
  const item = newLenientCsatReview("code-332", "label-891");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
