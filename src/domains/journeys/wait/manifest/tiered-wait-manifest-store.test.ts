import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredWaitManifestStore } from "./tiered-wait-manifest-store.js";
import { newTieredWaitManifest } from "./tiered-wait-manifest.js";

test("MemoryTieredWaitManifestStore finds what it saved", () => {
  const store = newMemoryTieredWaitManifestStore();
  const item = newTieredWaitManifest("code-447", "label-394");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
