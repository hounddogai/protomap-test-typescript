import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedTouchpointMilestoneStore } from "./capped-touchpoint-milestone-store.js";
import { newCappedTouchpointMilestone } from "./capped-touchpoint-milestone.js";

test("MemoryCappedTouchpointMilestoneStore finds what it saved", () => {
  const store = newMemoryCappedTouchpointMilestoneStore();
  const item = newCappedTouchpointMilestone("code-483", "name-958");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
