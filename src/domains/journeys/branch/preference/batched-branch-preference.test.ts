import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedBranchPreference } from "./batched-branch-preference.js";

test("BatchedBranchPreference starts in new", () => {
  const item = newBatchedBranchPreference("code-750", "title-433");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedBranchPreference moves to queued", () => {
  const item = newBatchedBranchPreference("code-750", "title-433");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("BatchedBranchPreference rejects moves from failed", () => {
  const item = newBatchedBranchPreference("code-750", "title-433");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
