import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictSlaMilestoneStore } from "./strict-sla-milestone-store.js";
import { newStrictSlaMilestone } from "./strict-sla-milestone.js";

test("MemoryStrictSlaMilestoneStore finds what it saved", () => {
  const store = newMemoryStrictSlaMilestoneStore();
  const item = newStrictSlaMilestone("code-151", "name-275");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
