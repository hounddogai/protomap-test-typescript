import assert from "node:assert/strict";
import { test } from "node:test";
import { newReplyEntry } from "./reply-entry.js";

test("ReplyEntry starts in proposed", () => {
  const item = newReplyEntry("code-512", "label-871");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ReplyEntry moves to approved", () => {
  const item = newReplyEntry("code-512", "label-871");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("ReplyEntry rejects moves from withdrawn", () => {
  const item = newReplyEntry("code-512", "label-871");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
