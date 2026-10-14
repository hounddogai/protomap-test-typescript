import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultReplyDigest } from "./default-reply-digest.js";

test("DefaultReplyDigest starts in new", () => {
  const item = newDefaultReplyDigest("code-36", "label-435");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultReplyDigest moves to running", () => {
  const item = newDefaultReplyDigest("code-36", "label-435");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("DefaultReplyDigest rejects moves from failed", () => {
  const item = newDefaultReplyDigest("code-36", "label-435");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
