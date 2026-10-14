import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingCreativeBundleStore } from "./pending-creative-bundle-store.js";
import { newPendingCreativeBundle } from "./pending-creative-bundle.js";

test("MemoryPendingCreativeBundleStore finds what it saved", () => {
  const store = newMemoryPendingCreativeBundleStore();
  const item = newPendingCreativeBundle("code-999", "name-84");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
