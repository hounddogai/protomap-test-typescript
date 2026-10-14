import assert from "node:assert/strict";
import { test } from "node:test";
import { newProofCycle } from "./proof-cycle.js";

test("ProofCycle starts in requested", () => {
  const item = newProofCycle("code-430", "title-130");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ProofCycle moves to granted", () => {
  const item = newProofCycle("code-430", "title-130");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("ProofCycle rejects moves from expired", () => {
  const item = newProofCycle("code-430", "title-130");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
