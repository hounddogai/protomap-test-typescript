import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientJourneyAssignment } from "./lenient-journey-assignment.js";

test("LenientJourneyAssignment starts in idle", () => {
  const item = newLenientJourneyAssignment("code-116", "label-620");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientJourneyAssignment moves to draining", () => {
  const item = newLenientJourneyAssignment("code-116", "label-620");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("LenientJourneyAssignment rejects moves from stopped", () => {
  const item = newLenientJourneyAssignment("code-116", "label-620");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
