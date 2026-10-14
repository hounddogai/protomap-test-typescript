import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingJourneyAssignment } from "./rolling-journey-assignment.js";

test("RollingJourneyAssignment starts in proposed", () => {
  const item = newRollingJourneyAssignment("code-342", "title-794");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingJourneyAssignment moves to withdrawn", () => {
  const item = newRollingJourneyAssignment("code-342", "title-794");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("RollingJourneyAssignment rejects moves from withdrawn", () => {
  const item = newRollingJourneyAssignment("code-342", "title-794");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
