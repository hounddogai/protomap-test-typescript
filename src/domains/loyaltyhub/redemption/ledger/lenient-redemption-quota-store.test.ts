import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientRedemptionQuotaStore } from "./lenient-redemption-quota-store.js";
import { newLenientRedemptionQuota } from "./lenient-redemption-quota.js";

test("MemoryLenientRedemptionQuotaStore finds what it saved", () => {
  const store = newMemoryLenientRedemptionQuotaStore();
  const item = newLenientRedemptionQuota("code-160", "name-316");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
