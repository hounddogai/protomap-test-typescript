import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackMentionReview } from "./fallback-mention-review.js";

test("FallbackMentionReview starts in requested", () => {
  const item = newFallbackMentionReview("code-444", "name-456");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackMentionReview moves to granted", () => {
  const item = newFallbackMentionReview("code-444", "name-456");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("FallbackMentionReview rejects moves from expired", () => {
  const item = newFallbackMentionReview("code-444", "name-456");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
