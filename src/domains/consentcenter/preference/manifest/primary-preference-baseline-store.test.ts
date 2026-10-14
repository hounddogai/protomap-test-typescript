import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryPreferenceBaselineStore } from "./primary-preference-baseline-store.js";
import { newPrimaryPreferenceBaseline } from "./primary-preference-baseline.js";

test("MemoryPrimaryPreferenceBaselineStore finds what it saved", () => {
  const store = newMemoryPrimaryPreferenceBaselineStore();
  const item = newPrimaryPreferenceBaseline("code-563", "title-910");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
