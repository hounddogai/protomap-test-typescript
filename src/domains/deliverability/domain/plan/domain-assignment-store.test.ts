import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDomainAssignmentStore } from "./domain-assignment-store.js";
import { newDomainAssignment } from "./domain-assignment.js";

test("MemoryDomainAssignmentStore finds what it saved", () => {
  const store = newMemoryDomainAssignmentStore();
  const item = newDomainAssignment("code-792", "label-259");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
