import assert from "node:assert/strict";
import { test } from "node:test";
import { newBranchReview } from "./branch-review.js";

test("BranchReview starts in requested", () => {
  const item = newBranchReview("code-566", "label-468");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BranchReview moves to expired", () => {
  const item = newBranchReview("code-566", "label-468");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("BranchReview rejects moves from expired", () => {
  const item = newBranchReview("code-566", "label-468");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
