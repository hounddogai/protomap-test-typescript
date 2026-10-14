import assert from "node:assert/strict";
import { test } from "node:test";
import { newBranchTarget } from "./branch-target.js";

test("BranchTarget starts in open", () => {
  const item = newBranchTarget("code-806", "label-138");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BranchTarget moves to in review", () => {
  const item = newBranchTarget("code-806", "label-138");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("BranchTarget rejects moves from archived", () => {
  const item = newBranchTarget("code-806", "label-138");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
