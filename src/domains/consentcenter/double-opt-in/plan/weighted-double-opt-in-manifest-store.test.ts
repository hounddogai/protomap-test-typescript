import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedDoubleOptInManifestStore } from "./weighted-double-opt-in-manifest-store.js";
import { newWeightedDoubleOptInManifest } from "./weighted-double-opt-in-manifest.js";

test("MemoryWeightedDoubleOptInManifestStore finds what it saved", () => {
  const store = newMemoryWeightedDoubleOptInManifestStore();
  const item = newWeightedDoubleOptInManifest("code-386", "label-502");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
