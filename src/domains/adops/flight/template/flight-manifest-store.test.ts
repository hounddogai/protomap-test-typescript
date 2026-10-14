import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFlightManifestStore } from "./flight-manifest-store.js";
import { newFlightManifest } from "./flight-manifest.js";

test("MemoryFlightManifestStore finds what it saved", () => {
  const store = newMemoryFlightManifestStore();
  const item = newFlightManifest("code-358", "label-858");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
