import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryWarmupReview } from "./primary-warmup-review.js";

test("PrimaryWarmupReview starts in planned", () => {
  const item = newPrimaryWarmupReview("code-327", "title-555");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryWarmupReview moves to completed", () => {
  const item = newPrimaryWarmupReview("code-327", "title-555");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("PrimaryWarmupReview rejects moves from cancelled", () => {
  const item = newPrimaryWarmupReview("code-327", "title-555");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
