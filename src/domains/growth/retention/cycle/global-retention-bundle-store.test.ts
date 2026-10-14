import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalRetentionBundleStore } from "./global-retention-bundle-store.js";
import { newGlobalRetentionBundle } from "./global-retention-bundle.js";

test("MemoryGlobalRetentionBundleStore finds what it saved", () => {
  const store = newMemoryGlobalRetentionBundleStore();
  const item = newGlobalRetentionBundle("code-807", "name-185");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
