import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCsatManifestStore } from "./csat-manifest-store.js";
import { newCsatManifest } from "./csat-manifest.js";

test("MemoryCsatManifestStore finds what it saved", () => {
  const store = newMemoryCsatManifestStore();
  const item = newCsatManifest("code-17", "label-749");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
