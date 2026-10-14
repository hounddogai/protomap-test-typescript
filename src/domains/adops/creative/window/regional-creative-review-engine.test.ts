import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRegionalCreativeReviewEngine } from "./regional-creative-review-engine.js";
import { newRegionalCreativeReview } from "./regional-creative-review.js";

test("RegionalCreativeReviewEngine keeps results within bounds", () => {
  const engine = defaultRegionalCreativeReviewEngine(flags.newRegistry());
  const item = newRegionalCreativeReview("code-225", "title-226");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
