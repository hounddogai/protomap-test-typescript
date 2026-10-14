import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalRedemptionBundleStore } from "./global-redemption-bundle-store.js";
import { newGlobalRedemptionBundle } from "./global-redemption-bundle.js";

test("MemoryGlobalRedemptionBundleStore finds what it saved", () => {
  const store = newMemoryGlobalRedemptionBundleStore();
  const item = newGlobalRedemptionBundle("code-445", "label-547");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
