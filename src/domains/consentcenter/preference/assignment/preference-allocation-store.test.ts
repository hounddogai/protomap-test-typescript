import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPreferenceAllocationStore } from "./preference-allocation-store.js";
import { newPreferenceAllocation } from "./preference-allocation.js";

test("MemoryPreferenceAllocationStore finds what it saved", () => {
  const store = newMemoryPreferenceAllocationStore();
  const item = newPreferenceAllocation("code-768", "name-216");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
