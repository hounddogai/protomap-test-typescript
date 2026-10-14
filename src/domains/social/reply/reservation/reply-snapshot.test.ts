import assert from "node:assert/strict";
import { test } from "node:test";
import { newReplySnapshot } from "./reply-snapshot.js";

test("ReplySnapshot starts in proposed", () => {
  const item = newReplySnapshot("code-919", "title-188");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ReplySnapshot moves to rejected", () => {
  const item = newReplySnapshot("code-919", "title-188");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("ReplySnapshot rejects moves from withdrawn", () => {
  const item = newReplySnapshot("code-919", "title-188");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
