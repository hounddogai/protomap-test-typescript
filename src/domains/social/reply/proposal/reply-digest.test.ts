import assert from "node:assert/strict";
import { test } from "node:test";
import { newReplyDigest } from "./reply-digest.js";

test("ReplyDigest starts in proposed", () => {
  const item = newReplyDigest("code-471", "label-602");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ReplyDigest moves to approved", () => {
  const item = newReplyDigest("code-471", "label-602");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("ReplyDigest rejects moves from withdrawn", () => {
  const item = newReplyDigest("code-471", "label-602");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
