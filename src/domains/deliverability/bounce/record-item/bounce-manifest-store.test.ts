import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBounceManifestStore } from "./bounce-manifest-store.js";
import { newBounceManifest } from "./bounce-manifest.js";

test("MemoryBounceManifestStore finds what it saved", () => {
  const store = newMemoryBounceManifestStore();
  const item = newBounceManifest("code-700", "name-939");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
