import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictBranchMilestoneStore } from "./strict-branch-milestone-store.js";
import { newStrictBranchMilestone } from "./strict-branch-milestone.js";

test("MemoryStrictBranchMilestoneStore finds what it saved", () => {
  const store = newMemoryStrictBranchMilestoneStore();
  const item = newStrictBranchMilestone("code-614", "name-315");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
