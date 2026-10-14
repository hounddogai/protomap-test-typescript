import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPlacementPreferenceStore } from "./placement-preference-store.js";
import { newPlacementPreference } from "./placement-preference.js";

test("MemoryPlacementPreferenceStore finds what it saved", () => {
  const store = newMemoryPlacementPreferenceStore();
  const item = newPlacementPreference("code-853", "name-380");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
