import assert from "node:assert/strict";
import { test } from "node:test";
import { newMentionReview } from "./mention-review.js";

test("MentionReview starts in requested", () => {
  const item = newMentionReview("code-146", "label-604");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("MentionReview moves to granted", () => {
  const item = newMentionReview("code-146", "label-604");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("MentionReview rejects moves from expired", () => {
  const item = newMentionReview("code-146", "label-604");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
