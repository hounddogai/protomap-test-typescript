import assert from "node:assert/strict";
import { test } from "node:test";
import { newTierBundle } from "./tier-bundle.js";

test("TierBundle starts in idle", () => {
  const item = newTierBundle("code-847", "name-25");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TierBundle moves to ready", () => {
  const item = newTierBundle("code-847", "name-25");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("TierBundle rejects moves from stopped", () => {
  const item = newTierBundle("code-847", "name-25");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
