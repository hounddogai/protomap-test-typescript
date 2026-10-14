import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedProofAgreement } from "./capped-proof-agreement.js";

test("CappedProofAgreement starts in idle", () => {
  const item = newCappedProofAgreement("code-529", "name-208");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedProofAgreement moves to draining", () => {
  const item = newCappedProofAgreement("code-529", "name-208");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("CappedProofAgreement rejects moves from stopped", () => {
  const item = newCappedProofAgreement("code-529", "name-208");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
