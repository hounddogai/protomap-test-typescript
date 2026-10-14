import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalBranchMilestone } from "./global-branch-milestone.js";

test("GlobalBranchMilestone starts in new", () => {
  const item = newGlobalBranchMilestone("code-597", "label-815");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalBranchMilestone moves to done", () => {
  const item = newGlobalBranchMilestone("code-597", "label-815");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("GlobalBranchMilestone rejects moves from failed", () => {
  const item = newGlobalBranchMilestone("code-597", "label-815");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
