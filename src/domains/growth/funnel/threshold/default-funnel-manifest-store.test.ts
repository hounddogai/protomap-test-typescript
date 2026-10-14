import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultFunnelManifestStore } from "./default-funnel-manifest-store.js";
import { newDefaultFunnelManifest } from "./default-funnel-manifest.js";

test("MemoryDefaultFunnelManifestStore finds what it saved", () => {
  const store = newMemoryDefaultFunnelManifestStore();
  const item = newDefaultFunnelManifest("code-506", "name-603");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
