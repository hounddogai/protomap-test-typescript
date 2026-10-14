import assert from "node:assert/strict";
import { test } from "node:test";
import { newProofRollup } from "./proof-rollup.js";

test("ProofRollup starts in idle", () => {
  const item = newProofRollup("code-377", "label-113");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ProofRollup moves to draining", () => {
  const item = newProofRollup("code-377", "label-113");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("ProofRollup rejects moves from stopped", () => {
  const item = newProofRollup("code-377", "label-113");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
