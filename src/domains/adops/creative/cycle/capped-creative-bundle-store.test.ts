import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedCreativeBundleStore } from "./capped-creative-bundle-store.js";
import { newCappedCreativeBundle } from "./capped-creative-bundle.js";

test("MemoryCappedCreativeBundleStore finds what it saved", () => {
  const store = newMemoryCappedCreativeBundleStore();
  const item = newCappedCreativeBundle("code-447", "label-764");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
