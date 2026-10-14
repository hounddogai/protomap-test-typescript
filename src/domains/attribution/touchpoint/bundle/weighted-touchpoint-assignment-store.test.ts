import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedTouchpointAssignmentStore } from "./weighted-touchpoint-assignment-store.js";
import { newWeightedTouchpointAssignment } from "./weighted-touchpoint-assignment.js";

test("MemoryWeightedTouchpointAssignmentStore finds what it saved", () => {
  const store = newMemoryWeightedTouchpointAssignmentStore();
  const item = newWeightedTouchpointAssignment("code-84", "label-815");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
