import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingInsightAssignmentStore } from "./rolling-insight-assignment-store.js";
import { newRollingInsightAssignment } from "./rolling-insight-assignment.js";

test("MemoryRollingInsightAssignmentStore finds what it saved", () => {
  const store = newMemoryRollingInsightAssignmentStore();
  const item = newRollingInsightAssignment("code-951", "name-551");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
