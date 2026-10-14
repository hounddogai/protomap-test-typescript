import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictPayoutAssignmentStore } from "./strict-payout-assignment-store.js";
import { newStrictPayoutAssignment } from "./strict-payout-assignment.js";

test("MemoryStrictPayoutAssignmentStore finds what it saved", () => {
  const store = newMemoryStrictPayoutAssignmentStore();
  const item = newStrictPayoutAssignment("code-531", "label-686");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
