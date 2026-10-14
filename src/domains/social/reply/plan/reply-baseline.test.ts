import assert from "node:assert/strict";
import { test } from "node:test";
import { newReplyBaseline } from "./reply-baseline.js";

test("ReplyBaseline starts in draft", () => {
  const item = newReplyBaseline("code-214", "label-574");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ReplyBaseline moves to suspended", () => {
  const item = newReplyBaseline("code-214", "label-574");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("ReplyBaseline rejects moves from closed", () => {
  const item = newReplyBaseline("code-214", "label-574");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
