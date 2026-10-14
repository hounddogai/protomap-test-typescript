import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientReputationReview } from "./lenient-reputation-review.js";

test("LenientReputationReview starts in proposed", () => {
  const item = newLenientReputationReview("code-644", "label-993");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientReputationReview moves to approved", () => {
  const item = newLenientReputationReview("code-644", "label-993");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("LenientReputationReview rejects moves from withdrawn", () => {
  const item = newLenientReputationReview("code-644", "label-993");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
