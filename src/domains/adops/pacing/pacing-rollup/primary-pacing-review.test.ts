import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryPacingReview } from "./primary-pacing-review.js";

test("PrimaryPacingReview starts in draft", () => {
  const item = newPrimaryPacingReview("code-134", "title-136");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryPacingReview moves to active", () => {
  const item = newPrimaryPacingReview("code-134", "title-136");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("PrimaryPacingReview rejects moves from closed", () => {
  const item = newPrimaryPacingReview("code-134", "title-136");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
