import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedProofProfile } from "./batched-proof-profile.js";

test("BatchedProofProfile starts in planned", () => {
  const item = newBatchedProofProfile("code-486", "label-731");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedProofProfile moves to scheduled", () => {
  const item = newBatchedProofProfile("code-486", "label-731");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("BatchedProofProfile rejects moves from cancelled", () => {
  const item = newBatchedProofProfile("code-486", "label-731");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
