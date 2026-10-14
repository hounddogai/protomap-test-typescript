import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalRetentionAssignmentStore } from "./global-retention-assignment-store.js";
import { newGlobalRetentionAssignment } from "./global-retention-assignment.js";

test("MemoryGlobalRetentionAssignmentStore finds what it saved", () => {
  const store = newMemoryGlobalRetentionAssignmentStore();
  const item = newGlobalRetentionAssignment("code-777", "title-951");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
