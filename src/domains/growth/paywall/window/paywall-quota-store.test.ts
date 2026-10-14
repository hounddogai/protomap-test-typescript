import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPaywallQuotaStore } from "./paywall-quota-store.js";
import { newPaywallQuota } from "./paywall-quota.js";

test("MemoryPaywallQuotaStore finds what it saved", () => {
  const store = newMemoryPaywallQuotaStore();
  const item = newPaywallQuota("code-867", "title-601");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
