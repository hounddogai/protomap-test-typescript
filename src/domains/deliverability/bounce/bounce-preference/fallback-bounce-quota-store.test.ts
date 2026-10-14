import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackBounceQuotaStore } from "./fallback-bounce-quota-store.js";
import { newFallbackBounceQuota } from "./fallback-bounce-quota.js";

test("MemoryFallbackBounceQuotaStore finds what it saved", () => {
  const store = newMemoryFallbackBounceQuotaStore();
  const item = newFallbackBounceQuota("code-702", "title-310");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
