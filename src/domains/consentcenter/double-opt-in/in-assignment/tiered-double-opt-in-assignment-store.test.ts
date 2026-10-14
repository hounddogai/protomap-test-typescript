import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredDoubleOptInAssignmentStore } from "./tiered-double-opt-in-assignment-store.js";
import { newTieredDoubleOptInAssignment } from "./tiered-double-opt-in-assignment.js";

test("MemoryTieredDoubleOptInAssignmentStore finds what it saved", () => {
  const store = newMemoryTieredDoubleOptInAssignmentStore();
  const item = newTieredDoubleOptInAssignment("code-27", "name-576");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
