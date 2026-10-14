import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingConversionPreferenceStore } from "./rolling-conversion-preference-store.js";
import { newRollingConversionPreference } from "./rolling-conversion-preference.js";

test("MemoryRollingConversionPreferenceStore finds what it saved", () => {
  const store = newMemoryRollingConversionPreferenceStore();
  const item = newRollingConversionPreference("code-432", "label-452");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
