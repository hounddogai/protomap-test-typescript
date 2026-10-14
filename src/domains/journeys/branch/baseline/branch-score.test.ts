import assert from "node:assert/strict";
import { test } from "node:test";
import { newBranchScore } from "./branch-score.js";

test("BranchScore starts in proposed", () => {
  const item = newBranchScore("code-192", "title-673");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BranchScore moves to approved", () => {
  const item = newBranchScore("code-192", "title-673");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("BranchScore rejects moves from withdrawn", () => {
  const item = newBranchScore("code-192", "title-673");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
