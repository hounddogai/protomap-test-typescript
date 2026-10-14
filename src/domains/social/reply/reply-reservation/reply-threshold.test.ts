import assert from "node:assert/strict";
import { test } from "node:test";
import { newReplyThreshold } from "./reply-threshold.js";

test("ReplyThreshold starts in open", () => {
  const item = newReplyThreshold("code-941", "name-816");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ReplyThreshold moves to resolved", () => {
  const item = newReplyThreshold("code-941", "name-816");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("ReplyThreshold rejects moves from archived", () => {
  const item = newReplyThreshold("code-941", "name-816");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
