import assert from "node:assert/strict";
import { test } from "node:test";
import { newCreditReview } from "./credit-review.js";

test("CreditReview starts in idle", () => {
  const item = newCreditReview("code-991", "label-799");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CreditReview moves to warming", () => {
  const item = newCreditReview("code-991", "label-799");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("CreditReview rejects moves from stopped", () => {
  const item = newCreditReview("code-991", "label-799");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
