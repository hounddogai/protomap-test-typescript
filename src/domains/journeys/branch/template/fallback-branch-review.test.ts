import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackBranchReview } from "./fallback-branch-review.js";

test("FallbackBranchReview starts in created", () => {
  const item = newFallbackBranchReview("code-419", "name-627");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackBranchReview moves to validated", () => {
  const item = newFallbackBranchReview("code-419", "name-627");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("FallbackBranchReview rejects moves from retired", () => {
  const item = newFallbackBranchReview("code-419", "name-627");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
