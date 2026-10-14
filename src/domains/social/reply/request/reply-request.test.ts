import assert from "node:assert/strict";
import { test } from "node:test";
import { newReplyRequest } from "./reply-request.js";

test("ReplyRequest starts in new", () => {
  const item = newReplyRequest("code-87", "title-76");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ReplyRequest moves to failed", () => {
  const item = newReplyRequest("code-87", "title-76");
  try {
    item.moveTo("failed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "failed", "status");
});

test("ReplyRequest rejects moves from failed", () => {
  const item = newReplyRequest("code-87", "title-76");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
