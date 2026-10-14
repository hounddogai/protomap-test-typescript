import assert from "node:assert/strict";
import { test } from "node:test";
import { newReplyMapping } from "./reply-mapping.js";

test("ReplyMapping starts in proposed", () => {
  const item = newReplyMapping("code-760", "label-693");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ReplyMapping moves to approved", () => {
  const item = newReplyMapping("code-760", "label-693");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("ReplyMapping rejects moves from withdrawn", () => {
  const item = newReplyMapping("code-760", "label-693");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
