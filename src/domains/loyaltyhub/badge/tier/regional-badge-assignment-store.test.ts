import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalBadgeAssignmentStore } from "./regional-badge-assignment-store.js";
import { newRegionalBadgeAssignment } from "./regional-badge-assignment.js";

test("MemoryRegionalBadgeAssignmentStore finds what it saved", () => {
  const store = newMemoryRegionalBadgeAssignmentStore();
  const item = newRegionalBadgeAssignment("code-276", "title-719");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
