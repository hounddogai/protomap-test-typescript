import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientSubscriptionMilestoneStore } from "./lenient-subscription-milestone-store.js";
import { newLenientSubscriptionMilestone } from "./lenient-subscription-milestone.js";

test("MemoryLenientSubscriptionMilestoneStore finds what it saved", () => {
  const store = newMemoryLenientSubscriptionMilestoneStore();
  const item = newLenientSubscriptionMilestone("code-854", "title-220");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
