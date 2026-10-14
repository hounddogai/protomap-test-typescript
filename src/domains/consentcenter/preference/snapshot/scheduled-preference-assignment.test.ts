import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledPreferenceAssignment } from "./scheduled-preference-assignment.js";

test("ScheduledPreferenceAssignment starts in proposed", () => {
  const item = newScheduledPreferenceAssignment("code-835", "title-525");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledPreferenceAssignment moves to approved", () => {
  const item = newScheduledPreferenceAssignment("code-835", "title-525");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("ScheduledPreferenceAssignment rejects moves from withdrawn", () => {
  const item = newScheduledPreferenceAssignment("code-835", "title-525");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
