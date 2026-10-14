import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPacingPreferenceStore } from "./pacing-preference-store.js";
import { newPacingPreference } from "./pacing-preference.js";

test("MemoryPacingPreferenceStore finds what it saved", () => {
  const store = newMemoryPacingPreferenceStore();
  const item = newPacingPreference("code-304", "name-335");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
