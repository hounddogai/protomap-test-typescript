import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultSlaPreferenceStore } from "./default-sla-preference-store.js";
import { newDefaultSlaPreference } from "./default-sla-preference.js";

test("MemoryDefaultSlaPreferenceStore finds what it saved", () => {
  const store = newMemoryDefaultSlaPreferenceStore();
  const item = newDefaultSlaPreference("code-72", "name-650");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
