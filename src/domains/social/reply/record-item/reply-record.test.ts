import assert from "node:assert/strict";
import { test } from "node:test";
import { newReplyRecord } from "./reply-record.js";

test("ReplyRecord starts in draft", () => {
  const item = newReplyRecord("code-201", "name-684");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ReplyRecord moves to pending", () => {
  const item = newReplyRecord("code-201", "name-684");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("ReplyRecord rejects moves from closed", () => {
  const item = newReplyRecord("code-201", "name-684");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
