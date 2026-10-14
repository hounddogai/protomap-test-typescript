import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalTierManifestStore } from "./global-tier-manifest-store.js";
import { newGlobalTierManifest } from "./global-tier-manifest.js";

test("MemoryGlobalTierManifestStore finds what it saved", () => {
  const store = newMemoryGlobalTierManifestStore();
  const item = newGlobalTierManifest("code-25", "name-707");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
