import assert from "node:assert/strict";
import { test } from "node:test";
import { newReplyVariance } from "./reply-variance.js";

test("ReplyVariance starts in proposed", () => {
  const item = newReplyVariance("code-82", "name-406");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ReplyVariance moves to rejected", () => {
  const item = newReplyVariance("code-82", "name-406");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("ReplyVariance rejects moves from withdrawn", () => {
  const item = newReplyVariance("code-82", "name-406");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
