import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualTierManifestStore } from "./manual-tier-manifest-store.js";
import { newManualTierManifest } from "./manual-tier-manifest.js";

test("MemoryManualTierManifestStore finds what it saved", () => {
  const store = newMemoryManualTierManifestStore();
  const item = newManualTierManifest("code-436", "label-103");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
