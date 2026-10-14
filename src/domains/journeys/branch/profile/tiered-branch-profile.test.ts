import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredBranchProfile } from "./tiered-branch-profile.js";

test("TieredBranchProfile starts in new", () => {
  const item = newTieredBranchProfile("code-971", "name-958");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredBranchProfile moves to running", () => {
  const item = newTieredBranchProfile("code-971", "name-958");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("TieredBranchProfile rejects moves from failed", () => {
  const item = newTieredBranchProfile("code-971", "name-958");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
