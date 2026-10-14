import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingApprovalMilestoneStore } from "./pending-approval-milestone-store.js";
import { newPendingApprovalMilestone } from "./pending-approval-milestone.js";

test("MemoryPendingApprovalMilestoneStore finds what it saved", () => {
  const store = newMemoryPendingApprovalMilestoneStore();
  const item = newPendingApprovalMilestone("code-341", "title-3");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
