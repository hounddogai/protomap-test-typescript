import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultCreativeAssignmentStore } from "./default-creative-assignment-store.js";
import { newDefaultCreativeAssignment } from "./default-creative-assignment.js";

test("MemoryDefaultCreativeAssignmentStore finds what it saved", () => {
  const store = newMemoryDefaultCreativeAssignmentStore();
  const item = newDefaultCreativeAssignment("code-314", "label-307");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
