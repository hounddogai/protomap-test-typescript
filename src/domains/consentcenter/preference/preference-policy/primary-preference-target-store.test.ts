import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryPreferenceTargetStore } from "./primary-preference-target-store.js";
import { newPrimaryPreferenceTarget } from "./primary-preference-target.js";

test("MemoryPrimaryPreferenceTargetStore finds what it saved", () => {
  const store = newMemoryPrimaryPreferenceTargetStore();
  const item = newPrimaryPreferenceTarget("code-757", "title-250");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
