import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingFraudCheckTier } from "./rolling-fraud-check-tier.js";

test("RollingFraudCheckTier starts in new", () => {
  const item = newRollingFraudCheckTier("code-290", "name-161");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingFraudCheckTier moves to queued", () => {
  const item = newRollingFraudCheckTier("code-290", "name-161");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("RollingFraudCheckTier rejects moves from failed", () => {
  const item = newRollingFraudCheckTier("code-290", "name-161");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
