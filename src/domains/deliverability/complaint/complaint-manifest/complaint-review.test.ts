import assert from "node:assert/strict";
import { test } from "node:test";
import { newComplaintReview } from "./complaint-review.js";

test("ComplaintReview starts in created", () => {
  const item = newComplaintReview("code-114", "label-334");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ComplaintReview moves to validated", () => {
  const item = newComplaintReview("code-114", "label-334");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("ComplaintReview rejects moves from retired", () => {
  const item = newComplaintReview("code-114", "label-334");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
