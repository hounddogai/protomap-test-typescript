import assert from "node:assert/strict";
import { test } from "node:test";
import { newJourneyEntry } from "./journey-entry.js";

test("JourneyEntry starts in idle", () => {
  const item = newJourneyEntry("code-896", "label-540");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("JourneyEntry moves to warming", () => {
  const item = newJourneyEntry("code-896", "label-540");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("JourneyEntry rejects moves from stopped", () => {
  const item = newJourneyEntry("code-896", "label-540");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
