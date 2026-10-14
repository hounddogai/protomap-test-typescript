import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRedemptionManifestStore } from "./redemption-manifest-store.js";
import { newRedemptionManifest } from "./redemption-manifest.js";

test("MemoryRedemptionManifestStore finds what it saved", () => {
  const store = newMemoryRedemptionManifestStore();
  const item = newRedemptionManifest("code-445", "title-368");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
