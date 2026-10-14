import assert from "node:assert/strict";
import { test } from "node:test";
import { newJourneyAdjustment } from "./journey-adjustment.js";

test("JourneyAdjustment starts in proposed", () => {
  const item = newJourneyAdjustment("code-842", "title-438");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("JourneyAdjustment moves to approved", () => {
  const item = newJourneyAdjustment("code-842", "title-438");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("JourneyAdjustment rejects moves from withdrawn", () => {
  const item = newJourneyAdjustment("code-842", "title-438");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
