import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalEnrollmentReview } from "./global-enrollment-review.js";

test("GlobalEnrollmentReview starts in created", () => {
  const item = newGlobalEnrollmentReview("code-593", "label-154");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalEnrollmentReview moves to published", () => {
  const item = newGlobalEnrollmentReview("code-593", "label-154");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("GlobalEnrollmentReview rejects moves from retired", () => {
  const item = newGlobalEnrollmentReview("code-593", "label-154");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
