import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedProofAssignmentStore } from "./weighted-proof-assignment-store.js";
import { newWeightedProofAssignment } from "./weighted-proof-assignment.js";

test("MemoryWeightedProofAssignmentStore finds what it saved", () => {
  const store = newMemoryWeightedProofAssignmentStore();
  const item = newWeightedProofAssignment("code-577", "name-347");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
