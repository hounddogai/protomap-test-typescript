import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalBadgeQuotaStore } from "./regional-badge-quota-store.js";
import { newRegionalBadgeQuota } from "./regional-badge-quota.js";

test("MemoryRegionalBadgeQuotaStore finds what it saved", () => {
  const store = newMemoryRegionalBadgeQuotaStore();
  const item = newRegionalBadgeQuota("code-557", "name-421");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
