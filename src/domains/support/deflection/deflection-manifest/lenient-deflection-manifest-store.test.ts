import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientDeflectionManifestStore } from "./lenient-deflection-manifest-store.js";
import { newLenientDeflectionManifest } from "./lenient-deflection-manifest.js";

test("MemoryLenientDeflectionManifestStore finds what it saved", () => {
  const store = newMemoryLenientDeflectionManifestStore();
  const item = newLenientDeflectionManifest("code-44", "name-510");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
