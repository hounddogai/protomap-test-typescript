import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedSuppressionAgreement } from "./batched-suppression-agreement.js";

test("BatchedSuppressionAgreement starts in new", () => {
  const item = newBatchedSuppressionAgreement("code-203", "name-864");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedSuppressionAgreement moves to failed", () => {
  const item = newBatchedSuppressionAgreement("code-203", "name-864");
  try {
    item.moveTo("failed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "failed", "status");
});

test("BatchedSuppressionAgreement rejects moves from failed", () => {
  const item = newBatchedSuppressionAgreement("code-203", "name-864");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
