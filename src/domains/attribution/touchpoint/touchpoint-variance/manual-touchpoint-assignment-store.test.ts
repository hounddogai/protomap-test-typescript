import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualTouchpointAssignmentStore } from "./manual-touchpoint-assignment-store.js";
import { newManualTouchpointAssignment } from "./manual-touchpoint-assignment.js";

test("MemoryManualTouchpointAssignmentStore finds what it saved", () => {
  const store = newMemoryManualTouchpointAssignmentStore();
  const item = newManualTouchpointAssignment("code-956", "name-254");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
