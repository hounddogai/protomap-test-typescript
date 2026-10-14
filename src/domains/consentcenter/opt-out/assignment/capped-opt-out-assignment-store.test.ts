import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedOptOutAssignmentStore } from "./capped-opt-out-assignment-store.js";
import { newCappedOptOutAssignment } from "./capped-opt-out-assignment.js";

test("MemoryCappedOptOutAssignmentStore finds what it saved", () => {
  const store = newMemoryCappedOptOutAssignmentStore();
  const item = newCappedOptOutAssignment("code-621", "title-611");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
