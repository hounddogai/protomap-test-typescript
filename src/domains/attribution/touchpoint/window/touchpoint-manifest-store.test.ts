import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTouchpointManifestStore } from "./touchpoint-manifest-store.js";
import { newTouchpointManifest } from "./touchpoint-manifest.js";

test("MemoryTouchpointManifestStore finds what it saved", () => {
  const store = newMemoryTouchpointManifestStore();
  const item = newTouchpointManifest("code-26", "name-265");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
