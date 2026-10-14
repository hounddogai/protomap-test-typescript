import assert from "node:assert/strict";
import { test } from "node:test";
import { newReplyPreference } from "./reply-preference.js";

test("ReplyPreference starts in new", () => {
  const item = newReplyPreference("code-850", "title-77");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ReplyPreference moves to failed", () => {
  const item = newReplyPreference("code-850", "title-77");
  try {
    item.moveTo("failed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "failed", "status");
});

test("ReplyPreference rejects moves from failed", () => {
  const item = newReplyPreference("code-850", "title-77");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
