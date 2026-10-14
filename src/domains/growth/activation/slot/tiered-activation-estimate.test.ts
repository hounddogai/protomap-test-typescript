import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredActivationEstimate } from "./tiered-activation-estimate.js";

test("TieredActivationEstimate starts in new", () => {
  const item = newTieredActivationEstimate("code-912", "name-439");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredActivationEstimate moves to failed", () => {
  const item = newTieredActivationEstimate("code-912", "name-439");
  try {
    item.moveTo("failed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "failed", "status");
});

test("TieredActivationEstimate rejects moves from failed", () => {
  const item = newTieredActivationEstimate("code-912", "name-439");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
