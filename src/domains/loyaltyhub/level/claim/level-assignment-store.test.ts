import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLevelAssignmentStore } from "./level-assignment-store.js";
import { newLevelAssignment } from "./level-assignment.js";

test("MemoryLevelAssignmentStore finds what it saved", () => {
  const store = newMemoryLevelAssignmentStore();
  const item = newLevelAssignment("code-392", "label-238");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
