import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedBranchAgreement } from "./batched-branch-agreement.js";

test("BatchedBranchAgreement starts in created", () => {
  const item = newBatchedBranchAgreement("code-39", "title-268");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedBranchAgreement moves to published", () => {
  const item = newBatchedBranchAgreement("code-39", "title-268");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("BatchedBranchAgreement rejects moves from retired", () => {
  const item = newBatchedBranchAgreement("code-39", "title-268");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
