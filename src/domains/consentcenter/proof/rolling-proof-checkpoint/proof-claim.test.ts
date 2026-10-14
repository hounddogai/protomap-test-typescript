import assert from "node:assert/strict";
import { test } from "node:test";
import { newProofClaim } from "./proof-claim.js";

test("ProofClaim starts in idle", () => {
  const item = newProofClaim("code-314", "label-482");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ProofClaim moves to warming", () => {
  const item = newProofClaim("code-314", "label-482");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("ProofClaim rejects moves from stopped", () => {
  const item = newProofClaim("code-314", "label-482");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
