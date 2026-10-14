import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictBranchReview } from "./strict-branch-review.js";

test("StrictBranchReview starts in requested", () => {
  const item = newStrictBranchReview("code-724", "title-542");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictBranchReview moves to granted", () => {
  const item = newStrictBranchReview("code-724", "title-542");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("StrictBranchReview rejects moves from expired", () => {
  const item = newStrictBranchReview("code-724", "title-542");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
