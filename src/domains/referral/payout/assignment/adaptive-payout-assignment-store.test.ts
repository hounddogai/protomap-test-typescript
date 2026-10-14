import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptivePayoutAssignmentStore } from "./adaptive-payout-assignment-store.js";
import { newAdaptivePayoutAssignment } from "./adaptive-payout-assignment.js";

test("MemoryAdaptivePayoutAssignmentStore finds what it saved", () => {
  const store = newMemoryAdaptivePayoutAssignmentStore();
  const item = newAdaptivePayoutAssignment("code-554", "title-207");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
