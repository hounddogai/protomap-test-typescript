import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultActivationReviewEngine } from "./activation-review-engine.js";
import { newActivationReview } from "./activation-review.js";

test("ActivationReviewEngine keeps results within bounds", () => {
  const engine = defaultActivationReviewEngine(flags.newRegistry());
  const item = newActivationReview("code-561", "title-143");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
