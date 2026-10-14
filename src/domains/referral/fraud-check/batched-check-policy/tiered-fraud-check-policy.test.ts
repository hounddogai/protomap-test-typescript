import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredFraudCheckPolicy } from "./tiered-fraud-check-policy.js";

test("TieredFraudCheckPolicy starts in idle", () => {
  const item = newTieredFraudCheckPolicy("code-206", "name-263");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredFraudCheckPolicy moves to ready", () => {
  const item = newTieredFraudCheckPolicy("code-206", "name-263");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("TieredFraudCheckPolicy rejects moves from stopped", () => {
  const item = newTieredFraudCheckPolicy("code-206", "name-263");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
