import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptivePlacementManifestStore } from "./adaptive-placement-manifest-store.js";
import { newAdaptivePlacementManifest } from "./adaptive-placement-manifest.js";

test("MemoryAdaptivePlacementManifestStore finds what it saved", () => {
  const store = newMemoryAdaptivePlacementManifestStore();
  const item = newAdaptivePlacementManifest("code-960", "label-876");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
