import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingOptOutMilestoneStore } from "./rolling-opt-out-milestone-store.js";
import { newRollingOptOutMilestone } from "./rolling-opt-out-milestone.js";

test("MemoryRollingOptOutMilestoneStore finds what it saved", () => {
  const store = newMemoryRollingOptOutMilestoneStore();
  const item = newRollingOptOutMilestone("code-435", "name-905");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
