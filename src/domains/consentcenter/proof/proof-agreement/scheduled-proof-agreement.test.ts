import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledProofAgreement } from "./scheduled-proof-agreement.js";

test("ScheduledProofAgreement starts in created", () => {
  const item = newScheduledProofAgreement("code-165", "label-967");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledProofAgreement moves to validated", () => {
  const item = newScheduledProofAgreement("code-165", "label-967");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("ScheduledProofAgreement rejects moves from retired", () => {
  const item = newScheduledProofAgreement("code-165", "label-967");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
