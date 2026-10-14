import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultScheduledMentionReviewEngine } from "./scheduled-mention-review-engine.js";
import { newScheduledMentionReview } from "./scheduled-mention-review.js";

test("ScheduledMentionReviewEngine keeps results within bounds", () => {
  const engine = defaultScheduledMentionReviewEngine(flags.newRegistry());
  const item = newScheduledMentionReview("code-320", "title-328");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
