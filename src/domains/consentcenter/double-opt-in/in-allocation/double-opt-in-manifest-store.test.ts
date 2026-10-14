import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDoubleOptInManifestStore } from "./double-opt-in-manifest-store.js";
import { newDoubleOptInManifest } from "./double-opt-in-manifest.js";

test("MemoryDoubleOptInManifestStore finds what it saved", () => {
  const store = newMemoryDoubleOptInManifestStore();
  const item = newDoubleOptInManifest("code-847", "name-885");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
