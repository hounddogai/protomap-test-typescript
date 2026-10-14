import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingConversionNotice } from "./pending-conversion-notice.js";

test("PendingConversionNotice starts in draft", () => {
  const item = newPendingConversionNotice("code-123", "title-88");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingConversionNotice moves to pending", () => {
  const item = newPendingConversionNotice("code-123", "title-88");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("PendingConversionNotice rejects moves from closed", () => {
  const item = newPendingConversionNotice("code-123", "title-88");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
