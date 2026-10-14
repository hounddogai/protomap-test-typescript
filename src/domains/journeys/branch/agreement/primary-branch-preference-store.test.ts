import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryBranchPreferenceStore } from "./primary-branch-preference-store.js";
import { newPrimaryBranchPreference } from "./primary-branch-preference.js";

test("MemoryPrimaryBranchPreferenceStore finds what it saved", () => {
  const store = newMemoryPrimaryBranchPreferenceStore();
  const item = newPrimaryBranchPreference("code-866", "name-660");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
