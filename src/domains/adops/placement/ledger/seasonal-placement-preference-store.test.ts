import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalPlacementPreferenceStore } from "./seasonal-placement-preference-store.js";
import { newSeasonalPlacementPreference } from "./seasonal-placement-preference.js";

test("MemorySeasonalPlacementPreferenceStore finds what it saved", () => {
  const store = newMemorySeasonalPlacementPreferenceStore();
  const item = newSeasonalPlacementPreference("code-758", "title-69");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
