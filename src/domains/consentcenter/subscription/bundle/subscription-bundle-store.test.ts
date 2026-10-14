import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySubscriptionBundleStore } from "./subscription-bundle-store.js";
import { newSubscriptionBundle } from "./subscription-bundle.js";

test("MemorySubscriptionBundleStore finds what it saved", () => {
  const store = newMemorySubscriptionBundleStore();
  const item = newSubscriptionBundle("code-906", "label-465");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
