import assert from "node:assert/strict";
import { test } from "node:test";
import { newJourneyAssignment } from "./journey-assignment.js";

test("JourneyAssignment starts in planned", () => {
  const item = newJourneyAssignment("code-462", "title-913");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("JourneyAssignment moves to scheduled", () => {
  const item = newJourneyAssignment("code-462", "title-913");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("JourneyAssignment rejects moves from cancelled", () => {
  const item = newJourneyAssignment("code-462", "title-913");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
