import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackJourneyReview } from "./fallback-journey-review.js";

test("FallbackJourneyReview starts in planned", () => {
  const item = newFallbackJourneyReview("code-616", "name-856");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackJourneyReview moves to cancelled", () => {
  const item = newFallbackJourneyReview("code-616", "name-856");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("FallbackJourneyReview rejects moves from cancelled", () => {
  const item = newFallbackJourneyReview("code-616", "name-856");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
