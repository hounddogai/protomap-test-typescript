import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCreativeMilestoneStore } from "./creative-milestone-store.js";
import { newCreativeMilestone } from "./creative-milestone.js";

test("MemoryCreativeMilestoneStore finds what it saved", () => {
  const store = newMemoryCreativeMilestoneStore();
  const item = newCreativeMilestone("code-696", "name-621");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
