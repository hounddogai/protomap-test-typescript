import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBranchPreferenceStore } from "./branch-preference-store.js";
import { newBranchPreference } from "./branch-preference.js";

test("MemoryBranchPreferenceStore finds what it saved", () => {
  const store = newMemoryBranchPreferenceStore();
  const item = newBranchPreference("code-268", "name-444");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
