import assert from "node:assert/strict";
import { test } from "node:test";
import { newProofGroup } from "./proof-group.js";

test("ProofGroup starts in proposed", () => {
  const item = newProofGroup("code-932", "title-572");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ProofGroup moves to rejected", () => {
  const item = newProofGroup("code-932", "title-572");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("ProofGroup rejects moves from withdrawn", () => {
  const item = newProofGroup("code-932", "title-572");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
