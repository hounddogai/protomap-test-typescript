import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPreferenceManifestStore } from "./preference-manifest-store.js";
import { newPreferenceManifest } from "./preference-manifest.js";

test("MemoryPreferenceManifestStore finds what it saved", () => {
  const store = newMemoryPreferenceManifestStore();
  const item = newPreferenceManifest("code-144", "title-278");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
