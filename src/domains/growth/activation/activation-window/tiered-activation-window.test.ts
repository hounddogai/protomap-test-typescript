import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredActivationWindow } from "./tiered-activation-window.js";

test("TieredActivationWindow starts in draft", () => {
  const item = newTieredActivationWindow("code-362", "title-155");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredActivationWindow moves to active", () => {
  const item = newTieredActivationWindow("code-362", "title-155");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("TieredActivationWindow rejects moves from closed", () => {
  const item = newTieredActivationWindow("code-362", "title-155");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
