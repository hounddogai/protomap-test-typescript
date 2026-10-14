import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryEnrollmentGroupStore } from "./enrollment-group-store.js";
import { newEnrollmentGroup } from "./enrollment-group.js";

test("MemoryEnrollmentGroupStore finds what it saved", () => {
  const store = newMemoryEnrollmentGroupStore();
  const item = newEnrollmentGroup("code-210", "name-108");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
