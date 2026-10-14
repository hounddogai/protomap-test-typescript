import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingOptOutAssignmentStore } from "./pending-opt-out-assignment-store.js";
import { newPendingOptOutAssignment } from "./pending-opt-out-assignment.js";

test("MemoryPendingOptOutAssignmentStore finds what it saved", () => {
  const store = newMemoryPendingOptOutAssignmentStore();
  const item = newPendingOptOutAssignment("code-155", "title-209");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
