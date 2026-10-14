import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFlightMilestoneStore } from "./flight-milestone-store.js";
import { newFlightMilestone } from "./flight-milestone.js";

test("MemoryFlightMilestoneStore finds what it saved", () => {
  const store = newMemoryFlightMilestoneStore();
  const item = newFlightMilestone("code-129", "title-159");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
