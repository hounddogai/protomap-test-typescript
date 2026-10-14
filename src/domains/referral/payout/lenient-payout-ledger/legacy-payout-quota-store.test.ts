import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyPayoutQuotaStore } from "./legacy-payout-quota-store.js";
import { newLegacyPayoutQuota } from "./legacy-payout-quota.js";

test("MemoryLegacyPayoutQuotaStore finds what it saved", () => {
  const store = newMemoryLegacyPayoutQuotaStore();
  const item = newLegacyPayoutQuota("code-422", "title-504");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
