import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedDeflectionManifestStore } from "./capped-deflection-manifest-store.js";
import { newCappedDeflectionManifest } from "./capped-deflection-manifest.js";

test("MemoryCappedDeflectionManifestStore finds what it saved", () => {
  const store = newMemoryCappedDeflectionManifestStore();
  const item = newCappedDeflectionManifest("code-736", "title-917");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
