import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRewardQuotaStore } from "./reward-quota-store.js";
import { newRewardQuota } from "./reward-quota.js";

test("MemoryRewardQuotaStore finds what it saved", () => {
  const store = newMemoryRewardQuotaStore();
  const item = newRewardQuota("code-175", "label-588");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
