import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveJourneyBatch } from "./adaptive-journey-batch.js";

test("AdaptiveJourneyBatch starts in new", () => {
  const item = newAdaptiveJourneyBatch("code-139", "title-12");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveJourneyBatch moves to queued", () => {
  const item = newAdaptiveJourneyBatch("code-139", "title-12");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("AdaptiveJourneyBatch rejects moves from failed", () => {
  const item = newAdaptiveJourneyBatch("code-139", "title-12");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
