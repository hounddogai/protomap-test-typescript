import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedProofDraft } from "./weighted-proof-draft.js";

test("WeightedProofDraft starts in proposed", () => {
  const item = newWeightedProofDraft("code-832", "label-284");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedProofDraft moves to approved", () => {
  const item = newWeightedProofDraft("code-832", "label-284");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("WeightedProofDraft rejects moves from withdrawn", () => {
  const item = newWeightedProofDraft("code-832", "label-284");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
