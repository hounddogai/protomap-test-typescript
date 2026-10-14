import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWindowBundleStore } from "./window-bundle-store.js";
import { newWindowBundle } from "./window-bundle.js";

test("MemoryWindowBundleStore finds what it saved", () => {
  const store = newMemoryWindowBundleStore();
  const item = newWindowBundle("code-805", "name-702");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
