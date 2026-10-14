import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalOptOutQuotaStore } from "./regional-opt-out-quota-store.js";
import { newRegionalOptOutQuota } from "./regional-opt-out-quota.js";

test("MemoryRegionalOptOutQuotaStore finds what it saved", () => {
  const store = newMemoryRegionalOptOutQuotaStore();
  const item = newRegionalOptOutQuota("code-362", "title-605");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
