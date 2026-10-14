import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryInsightPreferenceStore } from "./insight-preference-store.js";
import { newInsightPreference } from "./insight-preference.js";

test("MemoryInsightPreferenceStore finds what it saved", () => {
  const store = newMemoryInsightPreferenceStore();
  const item = newInsightPreference("code-134", "name-99");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
