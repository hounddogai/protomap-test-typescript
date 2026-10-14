import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingActivationReview } from "./pending-activation-review.js";

test("PendingActivationReview starts in proposed", () => {
  const item = newPendingActivationReview("code-605", "title-448");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingActivationReview moves to withdrawn", () => {
  const item = newPendingActivationReview("code-605", "title-448");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("PendingActivationReview rejects moves from withdrawn", () => {
  const item = newPendingActivationReview("code-605", "title-448");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
