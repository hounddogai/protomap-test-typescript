import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryQueueMilestoneStore } from "./queue-milestone-store.js";
import { newQueueMilestone } from "./queue-milestone.js";

test("MemoryQueueMilestoneStore finds what it saved", () => {
  const store = newMemoryQueueMilestoneStore();
  const item = newQueueMilestone("code-721", "name-583");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
