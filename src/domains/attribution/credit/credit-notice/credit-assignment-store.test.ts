import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCreditAssignmentStore } from "./credit-assignment-store.js";
import { newCreditAssignment } from "./credit-assignment.js";

test("MemoryCreditAssignmentStore finds what it saved", () => {
  const store = newMemoryCreditAssignmentStore();
  const item = newCreditAssignment("code-247", "title-600");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
