import assert from "node:assert/strict";
import { test } from "node:test";
import { newBranchMilestone } from "./branch-milestone.js";

test("BranchMilestone starts in proposed", () => {
  const item = newBranchMilestone("code-688", "title-139");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BranchMilestone moves to approved", () => {
  const item = newBranchMilestone("code-688", "title-139");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("BranchMilestone rejects moves from withdrawn", () => {
  const item = newBranchMilestone("code-688", "title-139");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
