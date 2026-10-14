import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFunnelManifestStore } from "./funnel-manifest-store.js";
import { newFunnelManifest } from "./funnel-manifest.js";

test("MemoryFunnelManifestStore finds what it saved", () => {
  const store = newMemoryFunnelManifestStore();
  const item = newFunnelManifest("code-399", "label-262");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
