import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedBranchAgreementStore } from "./batched-branch-agreement-store.js";
import { newBatchedBranchAgreement } from "./batched-branch-agreement.js";

test("MemoryBatchedBranchAgreementStore finds what it saved", () => {
  const store = newMemoryBatchedBranchAgreementStore();
  const item = newBatchedBranchAgreement("code-39", "title-268");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
