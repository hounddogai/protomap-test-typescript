import assert from "node:assert/strict";
import { test } from "node:test";
import { newSuppressionReview } from "./suppression-review.js";

test("SuppressionReview starts in draft", () => {
  const item = newSuppressionReview("code-124", "name-593");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SuppressionReview moves to active", () => {
  const item = newSuppressionReview("code-124", "name-593");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("SuppressionReview rejects moves from closed", () => {
  const item = newSuppressionReview("code-124", "name-593");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
