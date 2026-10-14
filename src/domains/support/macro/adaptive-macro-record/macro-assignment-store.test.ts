import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryMacroAssignmentStore } from "./macro-assignment-store.js";
import { newMacroAssignment } from "./macro-assignment.js";

test("MemoryMacroAssignmentStore finds what it saved", () => {
  const store = newMemoryMacroAssignmentStore();
  const item = newMacroAssignment("code-127", "label-607");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
