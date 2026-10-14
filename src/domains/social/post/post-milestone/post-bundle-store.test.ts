import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPostBundleStore } from "./post-bundle-store.js";
import { newPostBundle } from "./post-bundle.js";

test("MemoryPostBundleStore finds what it saved", () => {
  const store = newMemoryPostBundleStore();
  const item = newPostBundle("code-520", "name-252");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
