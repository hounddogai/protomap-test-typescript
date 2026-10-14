import assert from "node:assert/strict";
import { test } from "node:test";
import { newJourneyTier } from "./journey-tier.js";

test("JourneyTier starts in idle", () => {
  const item = newJourneyTier("code-94", "name-140");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("JourneyTier moves to warming", () => {
  const item = newJourneyTier("code-94", "name-140");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("JourneyTier rejects moves from stopped", () => {
  const item = newJourneyTier("code-94", "name-140");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
