import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictReputationTier } from "./strict-reputation-tier.js";

test("StrictReputationTier starts in idle", () => {
  const item = newStrictReputationTier("code-788", "label-923");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictReputationTier moves to draining", () => {
  const item = newStrictReputationTier("code-788", "label-923");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("StrictReputationTier rejects moves from stopped", () => {
  const item = newStrictReputationTier("code-788", "label-923");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
