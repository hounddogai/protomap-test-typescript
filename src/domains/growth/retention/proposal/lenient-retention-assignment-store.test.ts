import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientRetentionAssignmentStore } from "./lenient-retention-assignment-store.js";
import { newLenientRetentionAssignment } from "./lenient-retention-assignment.js";

test("MemoryLenientRetentionAssignmentStore finds what it saved", () => {
  const store = newMemoryLenientRetentionAssignmentStore();
  const item = newLenientRetentionAssignment("code-844", "name-566");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
