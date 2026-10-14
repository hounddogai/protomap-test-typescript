import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualRedemptionAssignmentStore } from "./manual-redemption-assignment-store.js";
import { newManualRedemptionAssignment } from "./manual-redemption-assignment.js";

test("MemoryManualRedemptionAssignmentStore finds what it saved", () => {
  const store = newMemoryManualRedemptionAssignmentStore();
  const item = newManualRedemptionAssignment("code-119", "label-501");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
