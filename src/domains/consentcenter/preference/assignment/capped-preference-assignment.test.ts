import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedPreferenceAssignment } from "./capped-preference-assignment.js";

test("CappedPreferenceAssignment starts in created", () => {
  const item = newCappedPreferenceAssignment("code-696", "label-811");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedPreferenceAssignment moves to published", () => {
  const item = newCappedPreferenceAssignment("code-696", "label-811");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("CappedPreferenceAssignment rejects moves from retired", () => {
  const item = newCappedPreferenceAssignment("code-696", "label-811");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
