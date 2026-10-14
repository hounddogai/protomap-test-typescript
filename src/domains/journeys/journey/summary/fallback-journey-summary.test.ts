import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackJourneySummary } from "./fallback-journey-summary.js";

test("FallbackJourneySummary starts in idle", () => {
  const item = newFallbackJourneySummary("code-80", "name-15");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackJourneySummary moves to draining", () => {
  const item = newFallbackJourneySummary("code-80", "name-15");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("FallbackJourneySummary rejects moves from stopped", () => {
  const item = newFallbackJourneySummary("code-80", "name-15");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
