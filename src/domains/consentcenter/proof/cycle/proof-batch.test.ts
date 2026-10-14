import assert from "node:assert/strict";
import { test } from "node:test";
import { newProofBatch } from "./proof-batch.js";

test("ProofBatch starts in requested", () => {
  const item = newProofBatch("code-53", "label-518");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ProofBatch moves to granted", () => {
  const item = newProofBatch("code-53", "label-518");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("ProofBatch rejects moves from expired", () => {
  const item = newProofBatch("code-53", "label-518");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
