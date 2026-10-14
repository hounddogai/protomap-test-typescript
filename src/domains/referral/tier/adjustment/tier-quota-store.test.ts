import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTierQuotaStore } from "./tier-quota-store.js";
import { newTierQuota } from "./tier-quota.js";

test("MemoryTierQuotaStore finds what it saved", () => {
  const store = newMemoryTierQuotaStore();
  const item = newTierQuota("code-511", "name-711");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
