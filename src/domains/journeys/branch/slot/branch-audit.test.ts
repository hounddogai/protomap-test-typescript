import assert from "node:assert/strict";
import { test } from "node:test";
import { newBranchAudit } from "./branch-audit.js";

test("BranchAudit starts in new", () => {
  const item = newBranchAudit("code-831", "name-548");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BranchAudit moves to running", () => {
  const item = newBranchAudit("code-831", "name-548");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("BranchAudit rejects moves from failed", () => {
  const item = newBranchAudit("code-831", "name-548");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
