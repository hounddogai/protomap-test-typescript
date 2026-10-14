import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBadgeReviewEngine } from "./badge-review-engine.js";
import { newBadgeReview } from "./badge-review.js";

test("BadgeReviewEngine keeps results within bounds", () => {
  const engine = defaultBadgeReviewEngine(flags.newRegistry());
  const item = newBadgeReview("code-908", "name-931");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
