import assert from "node:assert/strict";
import { test } from "node:test";
import { newJourneyReview } from "./journey-review.js";

test("JourneyReview starts in idle", () => {
  const item = newJourneyReview("code-529", "title-930");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("JourneyReview moves to draining", () => {
  const item = newJourneyReview("code-529", "title-930");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("JourneyReview rejects moves from stopped", () => {
  const item = newJourneyReview("code-529", "title-930");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
