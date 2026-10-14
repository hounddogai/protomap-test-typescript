import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientReputationAssignmentStore } from "./lenient-reputation-assignment-store.js";
import { newLenientReputationAssignment } from "./lenient-reputation-assignment.js";

test("MemoryLenientReputationAssignmentStore finds what it saved", () => {
  const store = newMemoryLenientReputationAssignmentStore();
  const item = newLenientReputationAssignment("code-544", "name-73");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
