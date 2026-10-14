import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredRedemptionQuotaStore } from "./tiered-redemption-quota-store.js";
import { newTieredRedemptionQuota } from "./tiered-redemption-quota.js";

test("MemoryTieredRedemptionQuotaStore finds what it saved", () => {
  const store = newMemoryTieredRedemptionQuotaStore();
  const item = newTieredRedemptionQuota("code-970", "label-398");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
