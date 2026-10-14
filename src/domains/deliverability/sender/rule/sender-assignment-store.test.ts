import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySenderAssignmentStore } from "./sender-assignment-store.js";
import { newSenderAssignment } from "./sender-assignment.js";

test("MemorySenderAssignmentStore finds what it saved", () => {
  const store = newMemorySenderAssignmentStore();
  const item = newSenderAssignment("code-58", "name-981");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
