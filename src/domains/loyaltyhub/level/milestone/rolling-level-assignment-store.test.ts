import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingLevelAssignmentStore } from "./rolling-level-assignment-store.js";
import { newRollingLevelAssignment } from "./rolling-level-assignment.js";

test("MemoryRollingLevelAssignmentStore finds what it saved", () => {
  const store = newMemoryRollingLevelAssignmentStore();
  const item = newRollingLevelAssignment("code-945", "name-446");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
