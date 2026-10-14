import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingRedemptionPolicy } from "./pending-redemption-policy.js";

test("PendingRedemptionPolicy starts in idle", () => {
  const item = newPendingRedemptionPolicy("code-187", "title-904");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingRedemptionPolicy moves to ready", () => {
  const item = newPendingRedemptionPolicy("code-187", "title-904");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("PendingRedemptionPolicy rejects moves from stopped", () => {
  const item = newPendingRedemptionPolicy("code-187", "title-904");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
