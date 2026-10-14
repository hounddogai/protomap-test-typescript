import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedActivationWindow } from "./batched-activation-window.js";

test("BatchedActivationWindow starts in draft", () => {
  const item = newBatchedActivationWindow("code-597", "label-315");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedActivationWindow moves to pending", () => {
  const item = newBatchedActivationWindow("code-597", "label-315");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("BatchedActivationWindow rejects moves from closed", () => {
  const item = newBatchedActivationWindow("code-597", "label-315");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
