import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictPreferenceManifestStore } from "./strict-preference-manifest-store.js";
import { newStrictPreferenceManifest } from "./strict-preference-manifest.js";

test("MemoryStrictPreferenceManifestStore finds what it saved", () => {
  const store = newMemoryStrictPreferenceManifestStore();
  const item = newStrictPreferenceManifest("code-247", "title-410");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
