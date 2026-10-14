import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWaitBundleStore } from "./wait-bundle-store.js";
import { newWaitBundle } from "./wait-bundle.js";

test("MemoryWaitBundleStore finds what it saved", () => {
  const store = newMemoryWaitBundleStore();
  const item = newWaitBundle("code-435", "name-427");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
