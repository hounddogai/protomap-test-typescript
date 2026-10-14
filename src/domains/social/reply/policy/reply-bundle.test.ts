import assert from "node:assert/strict";
import { test } from "node:test";
import { newReplyBundle } from "./reply-bundle.js";

test("ReplyBundle starts in new", () => {
  const item = newReplyBundle("code-432", "label-143");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ReplyBundle moves to running", () => {
  const item = newReplyBundle("code-432", "label-143");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("ReplyBundle rejects moves from failed", () => {
  const item = newReplyBundle("code-432", "label-143");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
