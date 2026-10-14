import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackDoubleOptInBundleStore } from "./fallback-double-opt-in-bundle-store.js";
import { newFallbackDoubleOptInBundle } from "./fallback-double-opt-in-bundle.js";

test("MemoryFallbackDoubleOptInBundleStore finds what it saved", () => {
  const store = newMemoryFallbackDoubleOptInBundleStore();
  const item = newFallbackDoubleOptInBundle("code-758", "name-29");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
