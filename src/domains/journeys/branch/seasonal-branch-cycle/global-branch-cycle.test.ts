import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalBranchCycle } from "./global-branch-cycle.js";

test("GlobalBranchCycle starts in new", () => {
  const item = newGlobalBranchCycle("code-128", "label-880");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalBranchCycle moves to done", () => {
  const item = newGlobalBranchCycle("code-128", "label-880");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("GlobalBranchCycle rejects moves from failed", () => {
  const item = newGlobalBranchCycle("code-128", "label-880");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
