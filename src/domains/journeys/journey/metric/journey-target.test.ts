import assert from "node:assert/strict";
import { test } from "node:test";
import { newJourneyTarget } from "./journey-target.js";

test("JourneyTarget starts in idle", () => {
  const item = newJourneyTarget("code-746", "name-974");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("JourneyTarget moves to warming", () => {
  const item = newJourneyTarget("code-746", "name-974");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("JourneyTarget rejects moves from stopped", () => {
  const item = newJourneyTarget("code-746", "name-974");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
