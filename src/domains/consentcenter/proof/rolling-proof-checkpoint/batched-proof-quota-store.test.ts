import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedProofQuotaStore } from "./batched-proof-quota-store.js";
import { newBatchedProofQuota } from "./batched-proof-quota.js";

test("MemoryBatchedProofQuotaStore finds what it saved", () => {
  const store = newMemoryBatchedProofQuotaStore();
  const item = newBatchedProofQuota("code-726", "label-349");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
