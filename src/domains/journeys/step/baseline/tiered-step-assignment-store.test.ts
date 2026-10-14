import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredStepAssignmentStore } from "./tiered-step-assignment-store.js";
import { newTieredStepAssignment } from "./tiered-step-assignment.js";

test("MemoryTieredStepAssignmentStore finds what it saved", () => {
  const store = newMemoryTieredStepAssignmentStore();
  const item = newTieredStepAssignment("code-816", "name-880");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
