import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledBounceMilestoneStore } from "./scheduled-bounce-milestone-store.js";
import { newScheduledBounceMilestone } from "./scheduled-bounce-milestone.js";

test("MemoryScheduledBounceMilestoneStore finds what it saved", () => {
  const store = newMemoryScheduledBounceMilestoneStore();
  const item = newScheduledBounceMilestone("code-467", "label-970");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
