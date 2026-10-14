import assert from "node:assert/strict";
import { test } from "node:test";
import { newBranchThreshold } from "./branch-threshold.js";

test("BranchThreshold starts in idle", () => {
  const item = newBranchThreshold("code-684", "title-536");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BranchThreshold moves to stopped", () => {
  const item = newBranchThreshold("code-684", "title-536");
  try {
    item.moveTo("stopped");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "stopped", "status");
});

test("BranchThreshold rejects moves from stopped", () => {
  const item = newBranchThreshold("code-684", "title-536");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
