import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBranchQuotaStore } from "./branch-quota-store.js";
import { newBranchQuota } from "./branch-quota.js";

test("MemoryBranchQuotaStore finds what it saved", () => {
  const store = newMemoryBranchQuotaStore();
  const item = newBranchQuota("code-736", "title-952");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
