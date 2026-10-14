import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedProofQuota } from "./batched-proof-quota.js";

test("BatchedProofQuota starts in created", () => {
  const item = newBatchedProofQuota("code-726", "label-349");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedProofQuota moves to published", () => {
  const item = newBatchedProofQuota("code-726", "label-349");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("BatchedProofQuota rejects moves from retired", () => {
  const item = newBatchedProofQuota("code-726", "label-349");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
