import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPreferenceMappingStore } from "./preference-mapping-store.js";
import { newPreferenceMapping } from "./preference-mapping.js";

test("MemoryPreferenceMappingStore finds what it saved", () => {
  const store = newMemoryPreferenceMappingStore();
  const item = newPreferenceMapping("code-777", "name-352");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
