import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredSuppressionEstimate } from "./tiered-suppression-estimate.js";

test("TieredSuppressionEstimate starts in idle", () => {
  const item = newTieredSuppressionEstimate("code-267", "name-36");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredSuppressionEstimate moves to warming", () => {
  const item = newTieredSuppressionEstimate("code-267", "name-36");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("TieredSuppressionEstimate rejects moves from stopped", () => {
  const item = newTieredSuppressionEstimate("code-267", "name-36");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
