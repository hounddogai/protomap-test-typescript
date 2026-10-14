import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBranchMilestoneStore } from "./branch-milestone-store.js";
import { newBranchMilestone } from "./branch-milestone.js";

test("MemoryBranchMilestoneStore finds what it saved", () => {
  const store = newMemoryBranchMilestoneStore();
  const item = newBranchMilestone("code-688", "title-139");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
