import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalBranchReview } from "./global-branch-review.js";

test("GlobalBranchReview starts in planned", () => {
  const item = newGlobalBranchReview("code-354", "label-50");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalBranchReview moves to completed", () => {
  const item = newGlobalBranchReview("code-354", "label-50");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("GlobalBranchReview rejects moves from cancelled", () => {
  const item = newGlobalBranchReview("code-354", "label-50");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
