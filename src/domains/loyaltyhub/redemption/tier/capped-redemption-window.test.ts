import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedRedemptionWindow } from "./capped-redemption-window.js";

test("CappedRedemptionWindow starts in draft", () => {
  const item = newCappedRedemptionWindow("code-577", "name-20");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedRedemptionWindow moves to pending", () => {
  const item = newCappedRedemptionWindow("code-577", "name-20");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("CappedRedemptionWindow rejects moves from closed", () => {
  const item = newCappedRedemptionWindow("code-577", "name-20");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
