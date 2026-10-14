import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientJourneyGroup } from "./lenient-journey-group.js";

test("LenientJourneyGroup starts in idle", () => {
  const item = newLenientJourneyGroup("code-559", "title-866");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientJourneyGroup moves to warming", () => {
  const item = newLenientJourneyGroup("code-559", "title-866");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("LenientJourneyGroup rejects moves from stopped", () => {
  const item = newLenientJourneyGroup("code-559", "title-866");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
