import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryApprovalVarianceStore } from "./approval-variance-store.js";
import { newApprovalVariance } from "./approval-variance.js";

test("MemoryApprovalVarianceStore finds what it saved", () => {
  const store = newMemoryApprovalVarianceStore();
  const item = newApprovalVariance("code-399", "title-201");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
