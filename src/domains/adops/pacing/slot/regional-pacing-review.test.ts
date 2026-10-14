import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalPacingReview } from "./regional-pacing-review.js";

test("RegionalPacingReview starts in draft", () => {
  const item = newRegionalPacingReview("code-616", "name-719");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalPacingReview moves to pending", () => {
  const item = newRegionalPacingReview("code-616", "name-719");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("RegionalPacingReview rejects moves from closed", () => {
  const item = newRegionalPacingReview("code-616", "name-719");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
