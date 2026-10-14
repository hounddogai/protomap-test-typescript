import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictLevelAssignmentStore } from "./strict-level-assignment-store.js";
import { newStrictLevelAssignment } from "./strict-level-assignment.js";

test("MemoryStrictLevelAssignmentStore finds what it saved", () => {
  const store = newMemoryStrictLevelAssignmentStore();
  const item = newStrictLevelAssignment("code-26", "title-264");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
