import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPathBundleStore } from "./path-bundle-store.js";
import { newPathBundle } from "./path-bundle.js";

test("MemoryPathBundleStore finds what it saved", () => {
  const store = newMemoryPathBundleStore();
  const item = newPathBundle("code-848", "title-433");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
