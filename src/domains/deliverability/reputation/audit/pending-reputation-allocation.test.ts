import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingReputationAllocation } from "./pending-reputation-allocation.js";

test("PendingReputationAllocation starts in new", () => {
  const item = newPendingReputationAllocation("code-111", "name-850");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingReputationAllocation moves to running", () => {
  const item = newPendingReputationAllocation("code-111", "name-850");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("PendingReputationAllocation rejects moves from failed", () => {
  const item = newPendingReputationAllocation("code-111", "name-850");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
