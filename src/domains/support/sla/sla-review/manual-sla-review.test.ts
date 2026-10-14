import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualSlaReview } from "./manual-sla-review.js";

test("ManualSlaReview starts in open", () => {
  const item = newManualSlaReview("code-10", "title-402");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualSlaReview moves to in review", () => {
  const item = newManualSlaReview("code-10", "title-402");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("ManualSlaReview rejects moves from archived", () => {
  const item = newManualSlaReview("code-10", "title-402");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
