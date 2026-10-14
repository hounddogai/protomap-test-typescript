import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictRedemptionWindow } from "./strict-redemption-window.js";

test("StrictRedemptionWindow starts in idle", () => {
  const item = newStrictRedemptionWindow("code-991", "title-931");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictRedemptionWindow moves to draining", () => {
  const item = newStrictRedemptionWindow("code-991", "title-931");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("StrictRedemptionWindow rejects moves from stopped", () => {
  const item = newStrictRedemptionWindow("code-991", "title-931");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
