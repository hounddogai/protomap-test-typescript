import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedActivationMilestoneStore } from "./capped-activation-milestone-store.js";
import { newCappedActivationMilestone } from "./capped-activation-milestone.js";

test("MemoryCappedActivationMilestoneStore finds what it saved", () => {
  const store = newMemoryCappedActivationMilestoneStore();
  const item = newCappedActivationMilestone("code-401", "label-3");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
