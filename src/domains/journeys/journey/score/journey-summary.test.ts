import assert from "node:assert/strict";
import { test } from "node:test";
import { newJourneySummary } from "./journey-summary.js";

test("JourneySummary starts in idle", () => {
  const item = newJourneySummary("code-892", "name-46");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("JourneySummary moves to draining", () => {
  const item = newJourneySummary("code-892", "name-46");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("JourneySummary rejects moves from stopped", () => {
  const item = newJourneySummary("code-892", "name-46");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
