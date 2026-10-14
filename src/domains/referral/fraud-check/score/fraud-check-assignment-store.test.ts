import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFraudCheckAssignmentStore } from "./fraud-check-assignment-store.js";
import { newFraudCheckAssignment } from "./fraud-check-assignment.js";

test("MemoryFraudCheckAssignmentStore finds what it saved", () => {
  const store = newMemoryFraudCheckAssignmentStore();
  const item = newFraudCheckAssignment("code-648", "title-850");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
