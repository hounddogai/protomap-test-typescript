import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalSlaPreferenceStore } from "./global-sla-preference-store.js";
import { newGlobalSlaPreference } from "./global-sla-preference.js";

test("MemoryGlobalSlaPreferenceStore finds what it saved", () => {
  const store = newMemoryGlobalSlaPreferenceStore();
  const item = newGlobalSlaPreference("code-149", "label-917");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
