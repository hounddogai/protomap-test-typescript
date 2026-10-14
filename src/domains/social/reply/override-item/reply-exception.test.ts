import assert from "node:assert/strict";
import { test } from "node:test";
import { newReplyException } from "./reply-exception.js";

test("ReplyException starts in created", () => {
  const item = newReplyException("code-124", "label-628");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ReplyException moves to published", () => {
  const item = newReplyException("code-124", "label-628");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("ReplyException rejects moves from retired", () => {
  const item = newReplyException("code-124", "label-628");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
