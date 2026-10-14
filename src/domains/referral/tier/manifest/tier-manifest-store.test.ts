import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTierManifestStore } from "./tier-manifest-store.js";
import { newTierManifest } from "./tier-manifest.js";

test("MemoryTierManifestStore finds what it saved", () => {
  const store = newMemoryTierManifestStore();
  const item = newTierManifest("code-861", "name-430");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
