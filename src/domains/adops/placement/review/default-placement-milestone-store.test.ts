import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultPlacementMilestoneStore } from "./default-placement-milestone-store.js";
import { newDefaultPlacementMilestone } from "./default-placement-milestone.js";

test("MemoryDefaultPlacementMilestoneStore finds what it saved", () => {
  const store = newMemoryDefaultPlacementMilestoneStore();
  const item = newDefaultPlacementMilestone("code-738", "name-709");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
