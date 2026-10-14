import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedPostQuotaStore } from "./batched-post-quota-store.js";
import { newBatchedPostQuota } from "./batched-post-quota.js";

test("MemoryBatchedPostQuotaStore finds what it saved", () => {
  const store = newMemoryBatchedPostQuotaStore();
  const item = newBatchedPostQuota("code-13", "name-169");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
