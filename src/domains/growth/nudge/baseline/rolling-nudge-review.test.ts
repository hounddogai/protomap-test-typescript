import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingNudgeReview } from "./rolling-nudge-review.js";

test("RollingNudgeReview starts in requested", () => {
  const item = newRollingNudgeReview("code-307", "label-70");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingNudgeReview moves to granted", () => {
  const item = newRollingNudgeReview("code-307", "label-70");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("RollingNudgeReview rejects moves from expired", () => {
  const item = newRollingNudgeReview("code-307", "label-70");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
