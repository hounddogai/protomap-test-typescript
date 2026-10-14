import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryJourneyMilestoneStore } from "./journey-milestone-store.js";
import { newJourneyMilestone } from "./journey-milestone.js";

test("MemoryJourneyMilestoneStore finds what it saved", () => {
  const store = newMemoryJourneyMilestoneStore();
  const item = newJourneyMilestone("code-385", "title-162");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
