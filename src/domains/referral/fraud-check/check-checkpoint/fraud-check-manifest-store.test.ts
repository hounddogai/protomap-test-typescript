import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFraudCheckManifestStore } from "./fraud-check-manifest-store.js";
import { newFraudCheckManifest } from "./fraud-check-manifest.js";

test("MemoryFraudCheckManifestStore finds what it saved", () => {
  const store = newMemoryFraudCheckManifestStore();
  const item = newFraudCheckManifest("code-610", "label-776");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
