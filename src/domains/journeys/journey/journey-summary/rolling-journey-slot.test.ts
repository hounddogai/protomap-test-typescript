import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingJourneySlot } from "./rolling-journey-slot.js";

test("RollingJourneySlot starts in idle", () => {
  const item = newRollingJourneySlot("code-788", "label-858");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingJourneySlot moves to warming", () => {
  const item = newRollingJourneySlot("code-788", "label-858");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("RollingJourneySlot rejects moves from stopped", () => {
  const item = newRollingJourneySlot("code-788", "label-858");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
