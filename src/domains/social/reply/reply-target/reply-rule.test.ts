import assert from "node:assert/strict";
import { test } from "node:test";
import { newReplyRule } from "./reply-rule.js";

test("ReplyRule starts in proposed", () => {
  const item = newReplyRule("code-526", "title-700");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ReplyRule moves to withdrawn", () => {
  const item = newReplyRule("code-526", "title-700");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("ReplyRule rejects moves from withdrawn", () => {
  const item = newReplyRule("code-526", "title-700");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
