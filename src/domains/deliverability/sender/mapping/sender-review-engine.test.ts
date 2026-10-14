import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSenderReviewEngine } from "./sender-review-engine.js";
import { newSenderReview } from "./sender-review.js";

test("SenderReviewEngine keeps results within bounds", () => {
  const engine = defaultSenderReviewEngine(flags.newRegistry());
  const item = newSenderReview("code-590", "name-429");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
