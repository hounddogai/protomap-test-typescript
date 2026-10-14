import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedWindowReview } from "./weighted-window-review.js";

test("WeightedWindowReview starts in requested", () => {
  const item = newWeightedWindowReview("code-680", "name-317");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedWindowReview moves to expired", () => {
  const item = newWeightedWindowReview("code-680", "name-317");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("WeightedWindowReview rejects moves from expired", () => {
  const item = newWeightedWindowReview("code-680", "name-317");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
