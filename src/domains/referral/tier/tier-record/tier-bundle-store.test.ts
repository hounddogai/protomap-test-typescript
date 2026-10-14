import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTierBundleStore } from "./tier-bundle-store.js";
import { newTierBundle } from "./tier-bundle.js";

test("MemoryTierBundleStore finds what it saved", () => {
  const store = newMemoryTierBundleStore();
  const item = newTierBundle("code-847", "name-25");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
