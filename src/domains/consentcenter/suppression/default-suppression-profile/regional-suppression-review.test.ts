import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalSuppressionReview } from "./regional-suppression-review.js";

test("RegionalSuppressionReview starts in created", () => {
  const item = newRegionalSuppressionReview("code-68", "name-964");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalSuppressionReview moves to published", () => {
  const item = newRegionalSuppressionReview("code-68", "name-964");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("RegionalSuppressionReview rejects moves from retired", () => {
  const item = newRegionalSuppressionReview("code-68", "name-964");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
