import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedJourneyReview } from "./capped-journey-review.js";

test("CappedJourneyReview starts in proposed", () => {
  const item = newCappedJourneyReview("code-97", "title-564");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedJourneyReview moves to withdrawn", () => {
  const item = newCappedJourneyReview("code-97", "title-564");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("CappedJourneyReview rejects moves from withdrawn", () => {
  const item = newCappedJourneyReview("code-97", "title-564");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
