import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualJourneySlot } from "./manual-journey-slot.js";

test("ManualJourneySlot starts in planned", () => {
  const item = newManualJourneySlot("code-16", "label-236");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualJourneySlot moves to in progress", () => {
  const item = newManualJourneySlot("code-16", "label-236");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("ManualJourneySlot rejects moves from cancelled", () => {
  const item = newManualJourneySlot("code-16", "label-236");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
