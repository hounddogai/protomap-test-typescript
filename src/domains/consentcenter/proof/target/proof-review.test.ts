import assert from "node:assert/strict";
import { test } from "node:test";
import { newProofReview } from "./proof-review.js";

test("ProofReview starts in planned", () => {
  const item = newProofReview("code-93", "title-934");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ProofReview moves to cancelled", () => {
  const item = newProofReview("code-93", "title-934");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("ProofReview rejects moves from cancelled", () => {
  const item = newProofReview("code-93", "title-934");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
