import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredFrequencyManifestStore } from "./tiered-frequency-manifest-store.js";
import { newTieredFrequencyManifest } from "./tiered-frequency-manifest.js";

test("MemoryTieredFrequencyManifestStore finds what it saved", () => {
  const store = newMemoryTieredFrequencyManifestStore();
  const item = newTieredFrequencyManifest("code-172", "name-921");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
