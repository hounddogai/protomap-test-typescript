import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingPreferenceSchedule } from "./rolling-preference-schedule.js";

test("RollingPreferenceSchedule starts in proposed", () => {
  const item = newRollingPreferenceSchedule("code-502", "name-818");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingPreferenceSchedule moves to approved", () => {
  const item = newRollingPreferenceSchedule("code-502", "name-818");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("RollingPreferenceSchedule rejects moves from withdrawn", () => {
  const item = newRollingPreferenceSchedule("code-502", "name-818");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
