import assert from "node:assert/strict";
import { test } from "node:test";
import { newJourneyBundle } from "./journey-bundle.js";

test("JourneyBundle starts in idle", () => {
  const item = newJourneyBundle("code-267", "name-268");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("JourneyBundle moves to ready", () => {
  const item = newJourneyBundle("code-267", "name-268");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("JourneyBundle rejects moves from stopped", () => {
  const item = newJourneyBundle("code-267", "name-268");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
