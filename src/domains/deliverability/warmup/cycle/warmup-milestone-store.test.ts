import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWarmupMilestoneStore } from "./warmup-milestone-store.js";
import { newWarmupMilestone } from "./warmup-milestone.js";

test("MemoryWarmupMilestoneStore finds what it saved", () => {
  const store = newMemoryWarmupMilestoneStore();
  const item = newWarmupMilestone("code-222", "label-672");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
