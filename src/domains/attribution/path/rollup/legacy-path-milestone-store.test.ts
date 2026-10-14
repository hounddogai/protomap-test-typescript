import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyPathMilestoneStore } from "./legacy-path-milestone-store.js";
import { newLegacyPathMilestone } from "./legacy-path-milestone.js";

test("MemoryLegacyPathMilestoneStore finds what it saved", () => {
  const store = newMemoryLegacyPathMilestoneStore();
  const item = newLegacyPathMilestone("code-49", "name-367");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
