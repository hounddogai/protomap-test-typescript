import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyPayoutBundleStore } from "./legacy-payout-bundle-store.js";
import { newLegacyPayoutBundle } from "./legacy-payout-bundle.js";

test("MemoryLegacyPayoutBundleStore finds what it saved", () => {
  const store = newMemoryLegacyPayoutBundleStore();
  const item = newLegacyPayoutBundle("code-904", "label-718");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
