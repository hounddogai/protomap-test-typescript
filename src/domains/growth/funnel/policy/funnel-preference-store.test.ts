import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFunnelPreferenceStore } from "./funnel-preference-store.js";
import { newFunnelPreference } from "./funnel-preference.js";

test("MemoryFunnelPreferenceStore finds what it saved", () => {
  const store = newMemoryFunnelPreferenceStore();
  const item = newFunnelPreference("code-361", "name-932");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
