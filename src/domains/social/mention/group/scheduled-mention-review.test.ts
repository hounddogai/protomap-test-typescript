import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledMentionReview } from "./scheduled-mention-review.js";

test("ScheduledMentionReview starts in draft", () => {
  const item = newScheduledMentionReview("code-320", "title-328");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledMentionReview moves to active", () => {
  const item = newScheduledMentionReview("code-320", "title-328");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("ScheduledMentionReview rejects moves from closed", () => {
  const item = newScheduledMentionReview("code-320", "title-328");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
