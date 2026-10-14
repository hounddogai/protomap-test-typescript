import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientModelAssignmentStore } from "./lenient-model-assignment-store.js";
import { newLenientModelAssignment } from "./lenient-model-assignment.js";

test("MemoryLenientModelAssignmentStore finds what it saved", () => {
  const store = newMemoryLenientModelAssignmentStore();
  const item = newLenientModelAssignment("code-115", "name-90");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
