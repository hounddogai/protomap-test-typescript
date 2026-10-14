import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalPathBundleStore } from "./regional-path-bundle-store.js";
import { newRegionalPathBundle } from "./regional-path-bundle.js";

test("MemoryRegionalPathBundleStore finds what it saved", () => {
  const store = newMemoryRegionalPathBundleStore();
  const item = newRegionalPathBundle("code-708", "label-195");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
