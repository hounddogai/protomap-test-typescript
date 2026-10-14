import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredReputationAssignmentStore } from "./tiered-reputation-assignment-store.js";
import { newTieredReputationAssignment } from "./tiered-reputation-assignment.js";

test("MemoryTieredReputationAssignmentStore finds what it saved", () => {
  const store = newMemoryTieredReputationAssignmentStore();
  const item = newTieredReputationAssignment("code-127", "label-531");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
