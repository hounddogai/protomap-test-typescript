import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDoubleOptInAssignmentStore } from "./double-opt-in-assignment-store.js";
import { newDoubleOptInAssignment } from "./double-opt-in-assignment.js";

test("MemoryDoubleOptInAssignmentStore finds what it saved", () => {
  const store = newMemoryDoubleOptInAssignmentStore();
  const item = newDoubleOptInAssignment("code-925", "name-693");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
