import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBidRuleQuotaStore } from "./bid-rule-quota-store.js";
import { newBidRuleQuota } from "./bid-rule-quota.js";

test("MemoryBidRuleQuotaStore finds what it saved", () => {
  const store = newMemoryBidRuleQuotaStore();
  const item = newBidRuleQuota("code-892", "title-492");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
