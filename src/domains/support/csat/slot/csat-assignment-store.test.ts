import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCsatAssignmentStore } from "./csat-assignment-store.js";
import { newCsatAssignment } from "./csat-assignment.js";

test("MemoryCsatAssignmentStore finds what it saved", () => {
  const store = newMemoryCsatAssignmentStore();
  const item = newCsatAssignment("code-610", "name-971");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
