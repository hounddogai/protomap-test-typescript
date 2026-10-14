import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingLevelQuotaStore } from "./pending-level-quota-store.js";
import { newPendingLevelQuota } from "./pending-level-quota.js";

test("MemoryPendingLevelQuotaStore finds what it saved", () => {
  const store = newMemoryPendingLevelQuotaStore();
  const item = newPendingLevelQuota("code-630", "label-79");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
