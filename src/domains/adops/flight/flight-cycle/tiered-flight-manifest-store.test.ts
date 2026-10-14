import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredFlightManifestStore } from "./tiered-flight-manifest-store.js";
import { newTieredFlightManifest } from "./tiered-flight-manifest.js";

test("MemoryTieredFlightManifestStore finds what it saved", () => {
  const store = newMemoryTieredFlightManifestStore();
  const item = newTieredFlightManifest("code-716", "name-203");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
