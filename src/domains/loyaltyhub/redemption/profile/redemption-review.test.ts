import assert from "node:assert/strict";
import { test } from "node:test";
import { newRedemptionReview } from "./redemption-review.js";

test("RedemptionReview starts in draft", () => {
  const item = newRedemptionReview("code-549", "title-181");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RedemptionReview moves to pending", () => {
  const item = newRedemptionReview("code-549", "title-181");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("RedemptionReview rejects moves from closed", () => {
  const item = newRedemptionReview("code-549", "title-181");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
