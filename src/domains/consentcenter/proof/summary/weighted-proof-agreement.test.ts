import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedProofAgreement } from "./weighted-proof-agreement.js";

test("WeightedProofAgreement starts in proposed", () => {
  const item = newWeightedProofAgreement("code-828", "label-866");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedProofAgreement moves to approved", () => {
  const item = newWeightedProofAgreement("code-828", "label-866");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("WeightedProofAgreement rejects moves from withdrawn", () => {
  const item = newWeightedProofAgreement("code-828", "label-866");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
