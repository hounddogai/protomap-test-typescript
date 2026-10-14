import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictPayoutQuotaStore } from "./strict-payout-quota-store.js";
import { newStrictPayoutQuota } from "./strict-payout-quota.js";

test("MemoryStrictPayoutQuotaStore finds what it saved", () => {
  const store = newMemoryStrictPayoutQuotaStore();
  const item = newStrictPayoutQuota("code-338", "title-349");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
