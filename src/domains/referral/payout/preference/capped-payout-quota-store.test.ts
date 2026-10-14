import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedPayoutQuotaStore } from "./capped-payout-quota-store.js";
import { newCappedPayoutQuota } from "./capped-payout-quota.js";

test("MemoryCappedPayoutQuotaStore finds what it saved", () => {
  const store = newMemoryCappedPayoutQuotaStore();
  const item = newCappedPayoutQuota("code-345", "label-172");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
