import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPostAssignmentStore } from "./post-assignment-store.js";
import { newPostAssignment } from "./post-assignment.js";

test("MemoryPostAssignmentStore finds what it saved", () => {
  const store = newMemoryPostAssignmentStore();
  const item = newPostAssignment("code-58", "title-952");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
