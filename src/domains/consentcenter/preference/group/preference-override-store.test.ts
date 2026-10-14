import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPreferenceOverrideStore } from "./preference-override-store.js";
import { newPreferenceOverride } from "./preference-override.js";

test("MemoryPreferenceOverrideStore finds what it saved", () => {
  const store = newMemoryPreferenceOverrideStore();
  const item = newPreferenceOverride("code-751", "label-821");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
