import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacySubscriptionBundleStore } from "./legacy-subscription-bundle-store.js";
import { newLegacySubscriptionBundle } from "./legacy-subscription-bundle.js";

test("MemoryLegacySubscriptionBundleStore finds what it saved", () => {
  const store = newMemoryLegacySubscriptionBundleStore();
  const item = newLegacySubscriptionBundle("code-456", "title-496");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
