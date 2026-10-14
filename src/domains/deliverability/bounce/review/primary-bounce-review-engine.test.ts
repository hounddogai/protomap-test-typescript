import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPrimaryBounceReviewEngine } from "./primary-bounce-review-engine.js";
import { newPrimaryBounceReview } from "./primary-bounce-review.js";

test("PrimaryBounceReviewEngine keeps results within bounds", () => {
  const engine = defaultPrimaryBounceReviewEngine(flags.newRegistry());
  const item = newPrimaryBounceReview("code-640", "title-640");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
