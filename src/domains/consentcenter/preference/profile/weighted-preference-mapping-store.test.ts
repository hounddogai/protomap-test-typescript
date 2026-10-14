import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedPreferenceMappingStore } from "./weighted-preference-mapping-store.js";
import { newWeightedPreferenceMapping } from "./weighted-preference-mapping.js";

test("MemoryWeightedPreferenceMappingStore finds what it saved", () => {
  const store = newMemoryWeightedPreferenceMappingStore();
  const item = newWeightedPreferenceMapping("code-136", "name-850");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
