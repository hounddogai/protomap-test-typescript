import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRetentionQuotaStore } from "./retention-quota-store.js";
import { newRetentionQuota } from "./retention-quota.js";

test("MemoryRetentionQuotaStore finds what it saved", () => {
  const store = newMemoryRetentionQuotaStore();
  const item = newRetentionQuota("code-698", "name-275");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
