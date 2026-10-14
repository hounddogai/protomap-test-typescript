import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalWarmupMilestoneStore } from "./global-warmup-milestone-store.js";
import { newGlobalWarmupMilestone } from "./global-warmup-milestone.js";

test("MemoryGlobalWarmupMilestoneStore finds what it saved", () => {
  const store = newMemoryGlobalWarmupMilestoneStore();
  const item = newGlobalWarmupMilestone("code-338", "name-743");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
