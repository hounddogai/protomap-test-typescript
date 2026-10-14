import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingTouchpointWindow } from "./pending-touchpoint-window.js";

test("PendingTouchpointWindow starts in draft", () => {
  const item = newPendingTouchpointWindow("code-594", "title-384");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingTouchpointWindow moves to pending", () => {
  const item = newPendingTouchpointWindow("code-594", "title-384");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("PendingTouchpointWindow rejects moves from closed", () => {
  const item = newPendingTouchpointWindow("code-594", "title-384");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
