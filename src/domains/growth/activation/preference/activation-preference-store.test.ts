import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryActivationPreferenceStore } from "./activation-preference-store.js";
import { newActivationPreference } from "./activation-preference.js";

test("MemoryActivationPreferenceStore finds what it saved", () => {
  const store = newMemoryActivationPreferenceStore();
  const item = newActivationPreference("code-575", "title-310");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
