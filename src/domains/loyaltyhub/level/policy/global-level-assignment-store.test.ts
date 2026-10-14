import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalLevelAssignmentStore } from "./global-level-assignment-store.js";
import { newGlobalLevelAssignment } from "./global-level-assignment.js";

test("MemoryGlobalLevelAssignmentStore finds what it saved", () => {
  const store = newMemoryGlobalLevelAssignmentStore();
  const item = newGlobalLevelAssignment("code-463", "name-550");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
