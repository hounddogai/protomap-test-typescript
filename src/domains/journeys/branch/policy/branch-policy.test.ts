import assert from "node:assert/strict";
import { test } from "node:test";
import { newBranchPolicy } from "./branch-policy.js";

test("BranchPolicy starts in proposed", () => {
  const item = newBranchPolicy("code-999", "name-197");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BranchPolicy moves to approved", () => {
  const item = newBranchPolicy("code-999", "name-197");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("BranchPolicy rejects moves from withdrawn", () => {
  const item = newBranchPolicy("code-999", "name-197");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
