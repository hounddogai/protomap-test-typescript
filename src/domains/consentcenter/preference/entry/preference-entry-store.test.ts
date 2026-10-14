import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPreferenceEntryStore } from "./preference-entry-store.js";
import { newPreferenceEntry } from "./preference-entry.js";

test("MemoryPreferenceEntryStore finds what it saved", () => {
  const store = newMemoryPreferenceEntryStore();
  const item = newPreferenceEntry("code-160", "label-582");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
