import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingWaitMilestoneStore } from "./pending-wait-milestone-store.js";
import { newPendingWaitMilestone } from "./pending-wait-milestone.js";

test("MemoryPendingWaitMilestoneStore finds what it saved", () => {
  const store = newMemoryPendingWaitMilestoneStore();
  const item = newPendingWaitMilestone("code-774", "title-818");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
