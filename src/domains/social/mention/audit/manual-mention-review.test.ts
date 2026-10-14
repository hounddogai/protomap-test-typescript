import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualMentionReview } from "./manual-mention-review.js";

test("ManualMentionReview starts in new", () => {
  const item = newManualMentionReview("code-823", "label-185");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualMentionReview moves to queued", () => {
  const item = newManualMentionReview("code-823", "label-185");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("ManualMentionReview rejects moves from failed", () => {
  const item = newManualMentionReview("code-823", "label-185");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
