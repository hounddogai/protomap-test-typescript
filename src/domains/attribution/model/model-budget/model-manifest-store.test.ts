import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryModelManifestStore } from "./model-manifest-store.js";
import { newModelManifest } from "./model-manifest.js";

test("MemoryModelManifestStore finds what it saved", () => {
  const store = newMemoryModelManifestStore();
  const item = newModelManifest("code-622", "label-555");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
