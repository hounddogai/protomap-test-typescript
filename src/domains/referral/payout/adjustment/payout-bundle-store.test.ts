import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPayoutBundleStore } from "./payout-bundle-store.js";
import { newPayoutBundle } from "./payout-bundle.js";

test("MemoryPayoutBundleStore finds what it saved", () => {
  const store = newMemoryPayoutBundleStore();
  const item = newPayoutBundle("code-856", "label-68");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
