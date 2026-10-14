import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPlacementManifestStore } from "./placement-manifest-store.js";
import { newPlacementManifest } from "./placement-manifest.js";

test("MemoryPlacementManifestStore finds what it saved", () => {
  const store = newMemoryPlacementManifestStore();
  const item = newPlacementManifest("code-117", "title-714");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
