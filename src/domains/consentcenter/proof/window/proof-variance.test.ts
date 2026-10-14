import assert from "node:assert/strict";
import { test } from "node:test";
import { newProofVariance } from "./proof-variance.js";

test("ProofVariance starts in proposed", () => {
  const item = newProofVariance("code-658", "name-797");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ProofVariance moves to approved", () => {
  const item = newProofVariance("code-658", "name-797");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("ProofVariance rejects moves from withdrawn", () => {
  const item = newProofVariance("code-658", "name-797");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
