import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualFunnelManifestStore } from "./manual-funnel-manifest-store.js";
import { newManualFunnelManifest } from "./manual-funnel-manifest.js";

test("MemoryManualFunnelManifestStore finds what it saved", () => {
  const store = newMemoryManualFunnelManifestStore();
  const item = newManualFunnelManifest("code-959", "name-996");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
