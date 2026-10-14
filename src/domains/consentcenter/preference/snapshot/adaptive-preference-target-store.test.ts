import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptivePreferenceTargetStore } from "./adaptive-preference-target-store.js";
import { newAdaptivePreferenceTarget } from "./adaptive-preference-target.js";

test("MemoryAdaptivePreferenceTargetStore finds what it saved", () => {
  const store = newMemoryAdaptivePreferenceTargetStore();
  const item = newAdaptivePreferenceTarget("code-124", "label-169");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
