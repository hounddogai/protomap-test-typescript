import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySuppressionManifestStore } from "./suppression-manifest-store.js";
import { newSuppressionManifest } from "./suppression-manifest.js";

test("MemorySuppressionManifestStore finds what it saved", () => {
  const store = newMemorySuppressionManifestStore();
  const item = newSuppressionManifest("code-463", "title-951");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
