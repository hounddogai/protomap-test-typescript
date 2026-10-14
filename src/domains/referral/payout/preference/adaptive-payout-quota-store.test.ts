import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptivePayoutQuotaStore } from "./adaptive-payout-quota-store.js";
import { newAdaptivePayoutQuota } from "./adaptive-payout-quota.js";

test("MemoryAdaptivePayoutQuotaStore finds what it saved", () => {
  const store = newMemoryAdaptivePayoutQuotaStore();
  const item = newAdaptivePayoutQuota("code-525", "label-341");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
