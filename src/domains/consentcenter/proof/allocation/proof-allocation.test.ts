import assert from "node:assert/strict";
import { test } from "node:test";
import { newProofAllocation } from "./proof-allocation.js";

test("ProofAllocation starts in proposed", () => {
  const item = newProofAllocation("code-650", "label-762");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ProofAllocation moves to withdrawn", () => {
  const item = newProofAllocation("code-650", "label-762");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("ProofAllocation rejects moves from withdrawn", () => {
  const item = newProofAllocation("code-650", "label-762");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
