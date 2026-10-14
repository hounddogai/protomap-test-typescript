import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBounceBundleStore } from "./bounce-bundle-store.js";
import { newBounceBundle } from "./bounce-bundle.js";

test("MemoryBounceBundleStore finds what it saved", () => {
  const store = newMemoryBounceBundleStore();
  const item = newBounceBundle("code-862", "label-297");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
