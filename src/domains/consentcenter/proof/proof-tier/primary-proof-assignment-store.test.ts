import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryProofAssignmentStore } from "./primary-proof-assignment-store.js";
import { newPrimaryProofAssignment } from "./primary-proof-assignment.js";

test("MemoryPrimaryProofAssignmentStore finds what it saved", () => {
  const store = newMemoryPrimaryProofAssignmentStore();
  const item = newPrimaryProofAssignment("code-84", "title-255");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
