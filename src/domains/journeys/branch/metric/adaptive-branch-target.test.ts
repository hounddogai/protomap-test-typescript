import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveBranchTarget } from "./adaptive-branch-target.js";

test("AdaptiveBranchTarget starts in idle", () => {
  const item = newAdaptiveBranchTarget("code-845", "name-937");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveBranchTarget moves to warming", () => {
  const item = newAdaptiveBranchTarget("code-845", "name-937");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("AdaptiveBranchTarget rejects moves from stopped", () => {
  const item = newAdaptiveBranchTarget("code-845", "name-937");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
