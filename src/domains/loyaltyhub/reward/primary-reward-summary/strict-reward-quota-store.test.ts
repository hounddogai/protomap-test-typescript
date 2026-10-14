import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictRewardQuotaStore } from "./strict-reward-quota-store.js";
import { newStrictRewardQuota } from "./strict-reward-quota.js";

test("MemoryStrictRewardQuotaStore finds what it saved", () => {
  const store = newMemoryStrictRewardQuotaStore();
  const item = newStrictRewardQuota("code-198", "name-570");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
