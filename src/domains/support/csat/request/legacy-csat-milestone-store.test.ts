import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyCsatMilestoneStore } from "./legacy-csat-milestone-store.js";
import { newLegacyCsatMilestone } from "./legacy-csat-milestone.js";

test("MemoryLegacyCsatMilestoneStore finds what it saved", () => {
  const store = newMemoryLegacyCsatMilestoneStore();
  const item = newLegacyCsatMilestone("code-452", "title-505");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
