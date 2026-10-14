import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualBadgeQuotaStore } from "./manual-badge-quota-store.js";
import { newManualBadgeQuota } from "./manual-badge-quota.js";

test("MemoryManualBadgeQuotaStore finds what it saved", () => {
  const store = newMemoryManualBadgeQuotaStore();
  const item = newManualBadgeQuota("code-470", "title-224");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
