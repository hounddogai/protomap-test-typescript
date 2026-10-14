import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingRedemptionVariance } from "./rolling-redemption-variance.js";

test("RollingRedemptionVariance starts in open", () => {
  const item = newRollingRedemptionVariance("code-889", "name-554");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingRedemptionVariance moves to resolved", () => {
  const item = newRollingRedemptionVariance("code-889", "name-554");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("RollingRedemptionVariance rejects moves from archived", () => {
  const item = newRollingRedemptionVariance("code-889", "name-554");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
