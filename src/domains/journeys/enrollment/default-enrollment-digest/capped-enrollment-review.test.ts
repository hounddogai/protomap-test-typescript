import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedEnrollmentReview } from "./capped-enrollment-review.js";

test("CappedEnrollmentReview starts in open", () => {
  const item = newCappedEnrollmentReview("code-497", "title-35");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedEnrollmentReview moves to in review", () => {
  const item = newCappedEnrollmentReview("code-497", "title-35");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("CappedEnrollmentReview rejects moves from archived", () => {
  const item = newCappedEnrollmentReview("code-497", "title-35");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
