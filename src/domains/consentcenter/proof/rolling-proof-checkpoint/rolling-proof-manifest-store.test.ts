import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingProofManifestStore } from "./rolling-proof-manifest-store.js";
import { newRollingProofManifest } from "./rolling-proof-manifest.js";

test("MemoryRollingProofManifestStore finds what it saved", () => {
  const store = newMemoryRollingProofManifestStore();
  const item = newRollingProofManifest("code-455", "name-541");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
