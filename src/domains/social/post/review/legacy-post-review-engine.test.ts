import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLegacyPostReviewEngine } from "./legacy-post-review-engine.js";
import { newLegacyPostReview } from "./legacy-post-review.js";

test("LegacyPostReviewEngine keeps results within bounds", () => {
  const engine = defaultLegacyPostReviewEngine(flags.newRegistry());
  const item = newLegacyPostReview("code-24", "title-950");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
