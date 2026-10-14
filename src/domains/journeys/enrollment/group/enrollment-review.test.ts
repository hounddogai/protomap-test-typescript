import assert from "node:assert/strict";
import { test } from "node:test";
import { newEnrollmentReview } from "./enrollment-review.js";

test("EnrollmentReview starts in proposed", () => {
  const item = newEnrollmentReview("code-250", "name-594");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("EnrollmentReview moves to withdrawn", () => {
  const item = newEnrollmentReview("code-250", "name-594");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("EnrollmentReview rejects moves from withdrawn", () => {
  const item = newEnrollmentReview("code-250", "name-594");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
