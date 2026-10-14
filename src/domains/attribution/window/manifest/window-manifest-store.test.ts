import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWindowManifestStore } from "./window-manifest-store.js";
import { newWindowManifest } from "./window-manifest.js";

test("MemoryWindowManifestStore finds what it saved", () => {
  const store = newMemoryWindowManifestStore();
  const item = newWindowManifest("code-447", "title-356");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
