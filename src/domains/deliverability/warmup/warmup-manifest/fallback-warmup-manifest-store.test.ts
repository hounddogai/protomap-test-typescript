import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackWarmupManifestStore } from "./fallback-warmup-manifest-store.js";
import { newFallbackWarmupManifest } from "./fallback-warmup-manifest.js";

test("MemoryFallbackWarmupManifestStore finds what it saved", () => {
  const store = newMemoryFallbackWarmupManifestStore();
  const item = newFallbackWarmupManifest("code-806", "title-261");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
