import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryApprovalEstimateStore } from "./approval-estimate-store.js";
import { newApprovalEstimate } from "./approval-estimate.js";

test("MemoryApprovalEstimateStore finds what it saved", () => {
  const store = newMemoryApprovalEstimateStore();
  const item = newApprovalEstimate("code-874", "name-26");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
