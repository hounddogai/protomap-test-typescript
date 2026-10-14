import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryPaywallManifestStore } from "./primary-paywall-manifest-store.js";
import { newPrimaryPaywallManifest } from "./primary-paywall-manifest.js";

test("MemoryPrimaryPaywallManifestStore finds what it saved", () => {
  const store = newMemoryPrimaryPaywallManifestStore();
  const item = newPrimaryPaywallManifest("code-716", "label-134");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
