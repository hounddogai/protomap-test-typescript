import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryApprovalMilestoneStore } from "./approval-milestone-store.js";
import { newApprovalMilestone } from "./approval-milestone.js";

test("MemoryApprovalMilestoneStore finds what it saved", () => {
  const store = newMemoryApprovalMilestoneStore();
  const item = newApprovalMilestone("code-904", "label-490");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
