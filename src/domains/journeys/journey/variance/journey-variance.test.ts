import assert from "node:assert/strict";
import { test } from "node:test";
import { newJourneyVariance } from "./journey-variance.js";

test("JourneyVariance starts in planned", () => {
  const item = newJourneyVariance("code-151", "label-45");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("JourneyVariance moves to scheduled", () => {
  const item = newJourneyVariance("code-151", "label-45");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("JourneyVariance rejects moves from cancelled", () => {
  const item = newJourneyVariance("code-151", "label-45");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
