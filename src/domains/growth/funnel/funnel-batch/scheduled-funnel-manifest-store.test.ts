import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledFunnelManifestStore } from "./scheduled-funnel-manifest-store.js";
import { newScheduledFunnelManifest } from "./scheduled-funnel-manifest.js";

test("MemoryScheduledFunnelManifestStore finds what it saved", () => {
  const store = newMemoryScheduledFunnelManifestStore();
  const item = newScheduledFunnelManifest("code-247", "name-139");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
