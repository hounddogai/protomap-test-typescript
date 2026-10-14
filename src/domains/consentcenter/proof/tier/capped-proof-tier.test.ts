import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedProofTier } from "./capped-proof-tier.js";

test("CappedProofTier starts in idle", () => {
  const item = newCappedProofTier("code-882", "title-921");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedProofTier moves to draining", () => {
  const item = newCappedProofTier("code-882", "title-921");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("CappedProofTier rejects moves from stopped", () => {
  const item = newCappedProofTier("code-882", "title-921");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
