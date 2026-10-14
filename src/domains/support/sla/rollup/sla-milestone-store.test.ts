import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySlaMilestoneStore } from "./sla-milestone-store.js";
import { newSlaMilestone } from "./sla-milestone.js";

test("MemorySlaMilestoneStore finds what it saved", () => {
  const store = newMemorySlaMilestoneStore();
  const item = newSlaMilestone("code-853", "name-454");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
