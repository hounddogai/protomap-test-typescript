import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredCreativeManifestStore } from "./tiered-creative-manifest-store.js";
import { newTieredCreativeManifest } from "./tiered-creative-manifest.js";

test("MemoryTieredCreativeManifestStore finds what it saved", () => {
  const store = newMemoryTieredCreativeManifestStore();
  const item = newTieredCreativeManifest("code-783", "title-336");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
