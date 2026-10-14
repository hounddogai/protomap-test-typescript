import assert from "node:assert/strict";
import { test } from "node:test";
import { newEscalationReview } from "./escalation-review.js";

test("EscalationReview starts in new", () => {
  const item = newEscalationReview("code-844", "title-721");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("EscalationReview moves to done", () => {
  const item = newEscalationReview("code-844", "title-721");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("EscalationReview rejects moves from failed", () => {
  const item = newEscalationReview("code-844", "title-721");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
