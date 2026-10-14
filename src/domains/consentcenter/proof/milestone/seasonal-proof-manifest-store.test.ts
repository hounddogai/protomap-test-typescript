import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalProofManifestStore } from "./seasonal-proof-manifest-store.js";
import { newSeasonalProofManifest } from "./seasonal-proof-manifest.js";

test("MemorySeasonalProofManifestStore finds what it saved", () => {
  const store = newMemorySeasonalProofManifestStore();
  const item = newSeasonalProofManifest("code-385", "name-392");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
