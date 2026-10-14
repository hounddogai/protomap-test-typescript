import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingBadgeAssignmentStore } from "./rolling-badge-assignment-store.js";
import { newRollingBadgeAssignment } from "./rolling-badge-assignment.js";

test("MemoryRollingBadgeAssignmentStore finds what it saved", () => {
  const store = newMemoryRollingBadgeAssignmentStore();
  const item = newRollingBadgeAssignment("code-64", "label-677");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
