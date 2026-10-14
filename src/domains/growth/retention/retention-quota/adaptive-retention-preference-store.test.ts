import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveRetentionPreferenceStore } from "./adaptive-retention-preference-store.js";
import { newAdaptiveRetentionPreference } from "./adaptive-retention-preference.js";

test("MemoryAdaptiveRetentionPreferenceStore finds what it saved", () => {
  const store = newMemoryAdaptiveRetentionPreferenceStore();
  const item = newAdaptiveRetentionPreference("code-976", "label-466");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
