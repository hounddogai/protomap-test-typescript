import assert from "node:assert/strict";
import { test } from "node:test";
import { newPreferenceAssignment } from "./preference-assignment.js";

test("PreferenceAssignment starts in created", () => {
  const item = newPreferenceAssignment("code-756", "label-745");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PreferenceAssignment moves to validated", () => {
  const item = newPreferenceAssignment("code-756", "label-745");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("PreferenceAssignment rejects moves from retired", () => {
  const item = newPreferenceAssignment("code-756", "label-745");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
