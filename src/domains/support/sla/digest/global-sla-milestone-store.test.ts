import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalSlaMilestoneStore } from "./global-sla-milestone-store.js";
import { newGlobalSlaMilestone } from "./global-sla-milestone.js";

test("MemoryGlobalSlaMilestoneStore finds what it saved", () => {
  const store = newMemoryGlobalSlaMilestoneStore();
  const item = newGlobalSlaMilestone("code-610", "label-606");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
