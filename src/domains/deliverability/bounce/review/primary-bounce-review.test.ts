import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryBounceReview } from "./primary-bounce-review.js";

test("PrimaryBounceReview starts in proposed", () => {
  const item = newPrimaryBounceReview("code-640", "title-640");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryBounceReview moves to approved", () => {
  const item = newPrimaryBounceReview("code-640", "title-640");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("PrimaryBounceReview rejects moves from withdrawn", () => {
  const item = newPrimaryBounceReview("code-640", "title-640");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
