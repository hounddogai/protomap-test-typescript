import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyBranchTier } from "./legacy-branch-tier.js";

test("LegacyBranchTier starts in idle", () => {
  const item = newLegacyBranchTier("code-46", "title-495");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyBranchTier moves to warming", () => {
  const item = newLegacyBranchTier("code-46", "title-495");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("LegacyBranchTier rejects moves from stopped", () => {
  const item = newLegacyBranchTier("code-46", "title-495");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
