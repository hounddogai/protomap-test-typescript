import assert from "node:assert/strict";
import { test } from "node:test";
import { newTierReview } from "./tier-review.js";

test("TierReview starts in created", () => {
  const item = newTierReview("code-304", "title-642");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TierReview moves to validated", () => {
  const item = newTierReview("code-304", "title-642");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("TierReview rejects moves from retired", () => {
  const item = newTierReview("code-304", "title-642");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
