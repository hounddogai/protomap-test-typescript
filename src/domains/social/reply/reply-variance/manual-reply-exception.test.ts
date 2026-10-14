import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualReplyException } from "./manual-reply-exception.js";

test("ManualReplyException starts in open", () => {
  const item = newManualReplyException("code-926", "label-363");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualReplyException moves to resolved", () => {
  const item = newManualReplyException("code-926", "label-363");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("ManualReplyException rejects moves from archived", () => {
  const item = newManualReplyException("code-926", "label-363");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
