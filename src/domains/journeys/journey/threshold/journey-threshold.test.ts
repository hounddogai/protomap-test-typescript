import assert from "node:assert/strict";
import { test } from "node:test";
import { newJourneyThreshold } from "./journey-threshold.js";

test("JourneyThreshold starts in planned", () => {
  const item = newJourneyThreshold("code-104", "label-764");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("JourneyThreshold moves to scheduled", () => {
  const item = newJourneyThreshold("code-104", "label-764");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("JourneyThreshold rejects moves from cancelled", () => {
  const item = newJourneyThreshold("code-104", "label-764");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
