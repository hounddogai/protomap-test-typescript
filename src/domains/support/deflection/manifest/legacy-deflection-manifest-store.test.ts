import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyDeflectionManifestStore } from "./legacy-deflection-manifest-store.js";
import { newLegacyDeflectionManifest } from "./legacy-deflection-manifest.js";

test("MemoryLegacyDeflectionManifestStore finds what it saved", () => {
  const store = newMemoryLegacyDeflectionManifestStore();
  const item = newLegacyDeflectionManifest("code-77", "label-378");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
