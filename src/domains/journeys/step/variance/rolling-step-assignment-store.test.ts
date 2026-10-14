import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingStepAssignmentStore } from "./rolling-step-assignment-store.js";
import { newRollingStepAssignment } from "./rolling-step-assignment.js";

test("MemoryRollingStepAssignmentStore finds what it saved", () => {
  const store = newMemoryRollingStepAssignmentStore();
  const item = newRollingStepAssignment("code-482", "title-389");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
