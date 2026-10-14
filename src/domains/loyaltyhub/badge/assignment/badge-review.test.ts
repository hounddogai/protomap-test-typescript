import assert from "node:assert/strict";
import { test } from "node:test";
import { newBadgeReview } from "./badge-review.js";

test("BadgeReview starts in draft", () => {
  const item = newBadgeReview("code-908", "name-931");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BadgeReview moves to pending", () => {
  const item = newBadgeReview("code-908", "name-931");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("BadgeReview rejects moves from closed", () => {
  const item = newBadgeReview("code-908", "name-931");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
