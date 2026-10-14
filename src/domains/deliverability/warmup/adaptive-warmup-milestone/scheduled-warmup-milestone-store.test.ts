import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledWarmupMilestoneStore } from "./scheduled-warmup-milestone-store.js";
import { newScheduledWarmupMilestone } from "./scheduled-warmup-milestone.js";

test("MemoryScheduledWarmupMilestoneStore finds what it saved", () => {
  const store = newMemoryScheduledWarmupMilestoneStore();
  const item = newScheduledWarmupMilestone("code-343", "label-451");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
