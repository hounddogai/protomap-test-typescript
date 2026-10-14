import assert from "node:assert/strict";
import { test } from "node:test";
import { newReplySlot } from "./reply-slot.js";

test("ReplySlot starts in requested", () => {
  const item = newReplySlot("code-519", "title-838");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ReplySlot moves to granted", () => {
  const item = newReplySlot("code-519", "title-838");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("ReplySlot rejects moves from expired", () => {
  const item = newReplySlot("code-519", "title-838");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
