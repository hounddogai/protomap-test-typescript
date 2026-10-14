import assert from "node:assert/strict";
import { test } from "node:test";
import { newProofTier } from "./proof-tier.js";

test("ProofTier starts in created", () => {
  const item = newProofTier("code-812", "title-82");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ProofTier moves to validated", () => {
  const item = newProofTier("code-812", "title-82");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("ProofTier rejects moves from retired", () => {
  const item = newProofTier("code-812", "title-82");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
