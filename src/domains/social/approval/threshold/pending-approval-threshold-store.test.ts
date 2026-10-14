import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingApprovalThresholdStore } from "./pending-approval-threshold-store.js";
import { newPendingApprovalThreshold } from "./pending-approval-threshold.js";

test("MemoryPendingApprovalThresholdStore finds what it saved", () => {
  const store = newMemoryPendingApprovalThresholdStore();
  const item = newPendingApprovalThreshold("code-768", "name-829");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
