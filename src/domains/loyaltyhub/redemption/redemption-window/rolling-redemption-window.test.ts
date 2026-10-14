import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingRedemptionWindow } from "./rolling-redemption-window.js";

test("RollingRedemptionWindow starts in draft", () => {
  const item = newRollingRedemptionWindow("code-359", "label-250");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingRedemptionWindow moves to pending", () => {
  const item = newRollingRedemptionWindow("code-359", "label-250");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("RollingRedemptionWindow rejects moves from closed", () => {
  const item = newRollingRedemptionWindow("code-359", "label-250");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
