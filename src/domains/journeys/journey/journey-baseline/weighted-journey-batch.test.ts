import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedJourneyBatch } from "./weighted-journey-batch.js";

test("WeightedJourneyBatch starts in open", () => {
  const item = newWeightedJourneyBatch("code-274", "label-399");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedJourneyBatch moves to in review", () => {
  const item = newWeightedJourneyBatch("code-274", "label-399");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("WeightedJourneyBatch rejects moves from archived", () => {
  const item = newWeightedJourneyBatch("code-274", "label-399");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
