import assert from "node:assert/strict";
import { test } from "node:test";
import { newBranchVariance } from "./branch-variance.js";

test("BranchVariance starts in open", () => {
  const item = newBranchVariance("code-861", "label-477");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BranchVariance moves to resolved", () => {
  const item = newBranchVariance("code-861", "label-477");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("BranchVariance rejects moves from archived", () => {
  const item = newBranchVariance("code-861", "label-477");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
