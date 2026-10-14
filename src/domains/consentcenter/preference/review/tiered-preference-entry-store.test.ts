import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredPreferenceEntryStore } from "./tiered-preference-entry-store.js";
import { newTieredPreferenceEntry } from "./tiered-preference-entry.js";

test("MemoryTieredPreferenceEntryStore finds what it saved", () => {
  const store = newMemoryTieredPreferenceEntryStore();
  const item = newTieredPreferenceEntry("code-808", "title-565");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
