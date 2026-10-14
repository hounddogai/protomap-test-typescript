import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedPreferenceOverrideStore } from "./capped-preference-override-store.js";
import { newCappedPreferenceOverride } from "./capped-preference-override.js";

test("MemoryCappedPreferenceOverrideStore finds what it saved", () => {
  const store = newMemoryCappedPreferenceOverrideStore();
  const item = newCappedPreferenceOverride("code-836", "title-287");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
