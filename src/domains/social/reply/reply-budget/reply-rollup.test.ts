import assert from "node:assert/strict";
import { test } from "node:test";
import { newReplyRollup } from "./reply-rollup.js";

test("ReplyRollup starts in draft", () => {
  const item = newReplyRollup("code-975", "title-20");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ReplyRollup moves to suspended", () => {
  const item = newReplyRollup("code-975", "title-20");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("ReplyRollup rejects moves from closed", () => {
  const item = newReplyRollup("code-975", "title-20");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
