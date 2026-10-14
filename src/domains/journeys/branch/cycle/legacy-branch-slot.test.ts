import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyBranchSlot } from "./legacy-branch-slot.js";

test("LegacyBranchSlot starts in idle", () => {
  const item = newLegacyBranchSlot("code-382", "title-242");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyBranchSlot moves to draining", () => {
  const item = newLegacyBranchSlot("code-382", "title-242");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("LegacyBranchSlot rejects moves from stopped", () => {
  const item = newLegacyBranchSlot("code-382", "title-242");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
