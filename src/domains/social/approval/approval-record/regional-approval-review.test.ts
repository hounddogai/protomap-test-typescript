import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalApprovalReview } from "./regional-approval-review.js";

test("RegionalApprovalReview starts in idle", () => {
  const item = newRegionalApprovalReview("code-352", "label-333");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalApprovalReview moves to warming", () => {
  const item = newRegionalApprovalReview("code-352", "label-333");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("RegionalApprovalReview rejects moves from stopped", () => {
  const item = newRegionalApprovalReview("code-352", "label-333");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
