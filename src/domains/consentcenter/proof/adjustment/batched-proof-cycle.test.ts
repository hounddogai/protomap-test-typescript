import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedProofCycle } from "./batched-proof-cycle.js";

test("BatchedProofCycle starts in idle", () => {
  const item = newBatchedProofCycle("code-754", "title-545");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedProofCycle moves to draining", () => {
  const item = newBatchedProofCycle("code-754", "title-545");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("BatchedProofCycle rejects moves from stopped", () => {
  const item = newBatchedProofCycle("code-754", "title-545");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
