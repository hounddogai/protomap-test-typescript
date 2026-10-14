import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySlaPreferenceStore } from "./sla-preference-store.js";
import { newSlaPreference } from "./sla-preference.js";

test("MemorySlaPreferenceStore finds what it saved", () => {
  const store = newMemorySlaPreferenceStore();
  const item = newSlaPreference("code-56", "label-201");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
