import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingMacroAssignmentStore } from "./rolling-macro-assignment-store.js";
import { newRollingMacroAssignment } from "./rolling-macro-assignment.js";

test("MemoryRollingMacroAssignmentStore finds what it saved", () => {
  const store = newMemoryRollingMacroAssignmentStore();
  const item = newRollingMacroAssignment("code-898", "name-932");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
