import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedProofRule } from "./batched-proof-rule.js";

test("BatchedProofRule starts in planned", () => {
  const item = newBatchedProofRule("code-912", "title-900");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedProofRule moves to completed", () => {
  const item = newBatchedProofRule("code-912", "title-900");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("BatchedProofRule rejects moves from cancelled", () => {
  const item = newBatchedProofRule("code-912", "title-900");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
