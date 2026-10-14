import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCsatPreferenceStore } from "./csat-preference-store.js";
import { newCsatPreference } from "./csat-preference.js";

test("MemoryCsatPreferenceStore finds what it saved", () => {
  const store = newMemoryCsatPreferenceStore();
  const item = newCsatPreference("code-351", "label-388");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
