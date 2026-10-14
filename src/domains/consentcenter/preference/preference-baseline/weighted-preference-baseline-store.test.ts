import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedPreferenceBaselineStore } from "./weighted-preference-baseline-store.js";
import { newWeightedPreferenceBaseline } from "./weighted-preference-baseline.js";

test("MemoryWeightedPreferenceBaselineStore finds what it saved", () => {
  const store = newMemoryWeightedPreferenceBaselineStore();
  const item = newWeightedPreferenceBaseline("code-189", "name-178");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
