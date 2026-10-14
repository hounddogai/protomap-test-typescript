import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedBidRuleQuotaStore } from "./capped-bid-rule-quota-store.js";
import { newCappedBidRuleQuota } from "./capped-bid-rule-quota.js";

test("MemoryCappedBidRuleQuotaStore finds what it saved", () => {
  const store = newMemoryCappedBidRuleQuotaStore();
  const item = newCappedBidRuleQuota("code-667", "title-571");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
