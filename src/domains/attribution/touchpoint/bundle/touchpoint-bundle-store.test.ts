import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTouchpointBundleStore } from "./touchpoint-bundle-store.js";
import { newTouchpointBundle } from "./touchpoint-bundle.js";

test("MemoryTouchpointBundleStore finds what it saved", () => {
  const store = newMemoryTouchpointBundleStore();
  const item = newTouchpointBundle("code-999", "name-940");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
