import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySubscriptionMilestoneStore } from "./subscription-milestone-store.js";
import { newSubscriptionMilestone } from "./subscription-milestone.js";

test("MemorySubscriptionMilestoneStore finds what it saved", () => {
  const store = newMemorySubscriptionMilestoneStore();
  const item = newSubscriptionMilestone("code-163", "title-699");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
