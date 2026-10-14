import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualFrequencyManifestStore } from "./manual-frequency-manifest-store.js";
import { newManualFrequencyManifest } from "./manual-frequency-manifest.js";

test("MemoryManualFrequencyManifestStore finds what it saved", () => {
  const store = newMemoryManualFrequencyManifestStore();
  const item = newManualFrequencyManifest("code-70", "label-417");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
