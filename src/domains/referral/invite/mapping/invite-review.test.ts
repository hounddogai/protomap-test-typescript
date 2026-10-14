import assert from "node:assert/strict";
import { test } from "node:test";
import { newInviteReview } from "./invite-review.js";

test("InviteReview starts in created", () => {
  const item = newInviteReview("code-172", "title-496");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("InviteReview moves to validated", () => {
  const item = newInviteReview("code-172", "title-496");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("InviteReview rejects moves from retired", () => {
  const item = newInviteReview("code-172", "title-496");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
