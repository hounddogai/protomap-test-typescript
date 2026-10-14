import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledPreferenceAssignmentStore } from "./scheduled-preference-assignment-store.js";
import { newScheduledPreferenceAssignment } from "./scheduled-preference-assignment.js";

test("MemoryScheduledPreferenceAssignmentStore finds what it saved", () => {
  const store = newMemoryScheduledPreferenceAssignmentStore();
  const item = newScheduledPreferenceAssignment("code-835", "title-525");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
