import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRetentionBundleStore } from "./retention-bundle-store.js";
import { newRetentionBundle } from "./retention-bundle.js";

test("MemoryRetentionBundleStore finds what it saved", () => {
  const store = newMemoryRetentionBundleStore();
  const item = newRetentionBundle("code-138", "label-489");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
