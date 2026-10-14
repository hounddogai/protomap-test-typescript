import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedActivationReview } from "./weighted-activation-review.js";

test("WeightedActivationReview starts in created", () => {
  const item = newWeightedActivationReview("code-588", "name-93");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedActivationReview moves to published", () => {
  const item = newWeightedActivationReview("code-588", "name-93");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("WeightedActivationReview rejects moves from retired", () => {
  const item = newWeightedActivationReview("code-588", "name-93");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
