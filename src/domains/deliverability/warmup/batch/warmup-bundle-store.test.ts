import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWarmupBundleStore } from "./warmup-bundle-store.js";
import { newWarmupBundle } from "./warmup-bundle.js";

test("MemoryWarmupBundleStore finds what it saved", () => {
  const store = newMemoryWarmupBundleStore();
  const item = newWarmupBundle("code-872", "title-205");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
