import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLevelReviewEngine } from "./level-review-engine.js";
import { newLevelReview } from "./level-review.js";

test("LevelReviewEngine keeps results within bounds", () => {
  const engine = defaultLevelReviewEngine(flags.newRegistry());
  const item = newLevelReview("code-157", "label-118");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
