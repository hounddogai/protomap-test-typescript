import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyModelMilestoneStore } from "./legacy-model-milestone-store.js";
import { newLegacyModelMilestone } from "./legacy-model-milestone.js";

test("MemoryLegacyModelMilestoneStore finds what it saved", () => {
  const store = newMemoryLegacyModelMilestoneStore();
  const item = newLegacyModelMilestone("code-918", "name-991");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
