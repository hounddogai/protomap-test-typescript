import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingNudgeReviewStore } from "./rolling-nudge-review-store.js";
import { newRollingNudgeReview } from "./rolling-nudge-review.js";

test("MemoryRollingNudgeReviewStore finds what it saved", () => {
  const store = newMemoryRollingNudgeReviewStore();
  const item = newRollingNudgeReview("code-307", "label-70");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
