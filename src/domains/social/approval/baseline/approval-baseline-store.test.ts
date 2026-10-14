import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryApprovalBaselineStore } from "./approval-baseline-store.js";
import { newApprovalBaseline } from "./approval-baseline.js";

test("MemoryApprovalBaselineStore finds what it saved", () => {
  const store = newMemoryApprovalBaselineStore();
  const item = newApprovalBaseline("code-678", "name-95");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
