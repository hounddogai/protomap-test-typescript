import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTouchpointMilestoneStore } from "./touchpoint-milestone-store.js";
import { newTouchpointMilestone } from "./touchpoint-milestone.js";

test("MemoryTouchpointMilestoneStore finds what it saved", () => {
  const store = newMemoryTouchpointMilestoneStore();
  const item = newTouchpointMilestone("code-256", "label-678");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
