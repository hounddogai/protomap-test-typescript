import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingLevelMilestoneStore } from "./pending-level-milestone-store.js";
import { newPendingLevelMilestone } from "./pending-level-milestone.js";

test("MemoryPendingLevelMilestoneStore finds what it saved", () => {
  const store = newMemoryPendingLevelMilestoneStore();
  const item = newPendingLevelMilestone("code-82", "label-7");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
