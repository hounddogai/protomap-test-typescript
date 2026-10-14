import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientModelManifestStore } from "./lenient-model-manifest-store.js";
import { newLenientModelManifest } from "./lenient-model-manifest.js";

test("MemoryLenientModelManifestStore finds what it saved", () => {
  const store = newMemoryLenientModelManifestStore();
  const item = newLenientModelManifest("code-300", "label-505");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
