import assert from "node:assert/strict";
import { test } from "node:test";
import { newReplyNotice } from "./reply-notice.js";

test("ReplyNotice starts in draft", () => {
  const item = newReplyNotice("code-269", "label-385");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ReplyNotice moves to closed", () => {
  const item = newReplyNotice("code-269", "label-385");
  try {
    item.moveTo("closed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "closed", "status");
});

test("ReplyNotice rejects moves from closed", () => {
  const item = newReplyNotice("code-269", "label-385");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
