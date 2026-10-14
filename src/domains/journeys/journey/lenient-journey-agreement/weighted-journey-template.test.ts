import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedJourneyTemplate } from "./weighted-journey-template.js";

test("WeightedJourneyTemplate starts in new", () => {
  const item = newWeightedJourneyTemplate("code-19", "label-465");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedJourneyTemplate moves to running", () => {
  const item = newWeightedJourneyTemplate("code-19", "label-465");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("WeightedJourneyTemplate rejects moves from failed", () => {
  const item = newWeightedJourneyTemplate("code-19", "label-465");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
