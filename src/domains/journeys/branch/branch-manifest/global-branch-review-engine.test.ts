import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultGlobalBranchReviewEngine } from "./global-branch-review-engine.js";
import { newGlobalBranchReview } from "./global-branch-review.js";

test("GlobalBranchReviewEngine keeps results within bounds", () => {
  const engine = defaultGlobalBranchReviewEngine(flags.newRegistry());
  const item = newGlobalBranchReview("code-354", "label-50");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
