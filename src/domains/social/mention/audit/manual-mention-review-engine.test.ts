import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultManualMentionReviewEngine } from "./manual-mention-review-engine.js";
import { newManualMentionReview } from "./manual-mention-review.js";

test("ManualMentionReviewEngine keeps results within bounds", () => {
  const engine = defaultManualMentionReviewEngine(flags.newRegistry());
  const item = newManualMentionReview("code-823", "label-185");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
