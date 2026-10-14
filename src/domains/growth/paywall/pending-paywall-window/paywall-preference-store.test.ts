import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPaywallPreferenceStore } from "./paywall-preference-store.js";
import { newPaywallPreference } from "./paywall-preference.js";

test("MemoryPaywallPreferenceStore finds what it saved", () => {
  const store = newMemoryPaywallPreferenceStore();
  const item = newPaywallPreference("code-610", "title-898");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
