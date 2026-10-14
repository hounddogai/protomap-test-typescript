import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPayoutManifestStore } from "./payout-manifest-store.js";
import { newPayoutManifest } from "./payout-manifest.js";

test("MemoryPayoutManifestStore finds what it saved", () => {
  const store = newMemoryPayoutManifestStore();
  const item = newPayoutManifest("code-55", "label-145");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
