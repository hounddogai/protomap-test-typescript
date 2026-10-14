import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictSubscriptionBundleStore } from "./strict-subscription-bundle-store.js";
import { newStrictSubscriptionBundle } from "./strict-subscription-bundle.js";

test("MemoryStrictSubscriptionBundleStore finds what it saved", () => {
  const store = newMemoryStrictSubscriptionBundleStore();
  const item = newStrictSubscriptionBundle("code-866", "name-948");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
