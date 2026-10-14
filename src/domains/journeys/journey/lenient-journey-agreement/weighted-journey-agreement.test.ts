import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedJourneyAgreement } from "./weighted-journey-agreement.js";

test("WeightedJourneyAgreement starts in idle", () => {
  const item = newWeightedJourneyAgreement("code-259", "title-146");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedJourneyAgreement moves to ready", () => {
  const item = newWeightedJourneyAgreement("code-259", "title-146");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("WeightedJourneyAgreement rejects moves from stopped", () => {
  const item = newWeightedJourneyAgreement("code-259", "title-146");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
