import assert from "node:assert/strict";
import { test } from "node:test";
import { newBranchCycle } from "./branch-cycle.js";

test("BranchCycle starts in new", () => {
  const item = newBranchCycle("code-624", "title-324");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BranchCycle moves to running", () => {
  const item = newBranchCycle("code-624", "title-324");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("BranchCycle rejects moves from failed", () => {
  const item = newBranchCycle("code-624", "title-324");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
