import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedPreferenceAssignmentStore } from "./capped-preference-assignment-store.js";
import { newCappedPreferenceAssignment } from "./capped-preference-assignment.js";

test("MemoryCappedPreferenceAssignmentStore finds what it saved", () => {
  const store = newMemoryCappedPreferenceAssignmentStore();
  const item = newCappedPreferenceAssignment("code-696", "label-811");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
