import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryTouchpointManifestStore } from "./primary-touchpoint-manifest-store.js";
import { newPrimaryTouchpointManifest } from "./primary-touchpoint-manifest.js";

test("MemoryPrimaryTouchpointManifestStore finds what it saved", () => {
  const store = newMemoryPrimaryTouchpointManifestStore();
  const item = newPrimaryTouchpointManifest("code-221", "label-598");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
