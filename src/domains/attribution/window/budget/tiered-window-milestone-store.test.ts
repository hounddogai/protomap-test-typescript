import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredWindowMilestoneStore } from "./tiered-window-milestone-store.js";
import { newTieredWindowMilestone } from "./tiered-window-milestone.js";

test("MemoryTieredWindowMilestoneStore finds what it saved", () => {
  const store = newMemoryTieredWindowMilestoneStore();
  const item = newTieredWindowMilestone("code-356", "label-213");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
