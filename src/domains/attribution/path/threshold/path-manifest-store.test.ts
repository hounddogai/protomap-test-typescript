import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPathManifestStore } from "./path-manifest-store.js";
import { newPathManifest } from "./path-manifest.js";

test("MemoryPathManifestStore finds what it saved", () => {
  const store = newMemoryPathManifestStore();
  const item = newPathManifest("code-106", "label-542");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
