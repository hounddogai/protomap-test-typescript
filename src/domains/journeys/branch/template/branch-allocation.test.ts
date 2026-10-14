import assert from "node:assert/strict";
import { test } from "node:test";
import { newBranchAllocation } from "./branch-allocation.js";

test("BranchAllocation starts in new", () => {
  const item = newBranchAllocation("code-770", "name-39");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BranchAllocation moves to done", () => {
  const item = newBranchAllocation("code-770", "name-39");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("BranchAllocation rejects moves from failed", () => {
  const item = newBranchAllocation("code-770", "name-39");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
