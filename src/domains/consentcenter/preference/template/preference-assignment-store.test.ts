import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPreferenceAssignmentStore } from "./preference-assignment-store.js";
import { newPreferenceAssignment } from "./preference-assignment.js";

test("MemoryPreferenceAssignmentStore finds what it saved", () => {
  const store = newMemoryPreferenceAssignmentStore();
  const item = newPreferenceAssignment("code-756", "label-745");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
