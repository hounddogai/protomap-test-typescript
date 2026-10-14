import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingOptOutReview } from "./rolling-opt-out-review.js";

test("RollingOptOutReview starts in new", () => {
  const item = newRollingOptOutReview("code-156", "title-834");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingOptOutReview moves to running", () => {
  const item = newRollingOptOutReview("code-156", "title-834");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("RollingOptOutReview rejects moves from failed", () => {
  const item = newRollingOptOutReview("code-156", "title-834");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
