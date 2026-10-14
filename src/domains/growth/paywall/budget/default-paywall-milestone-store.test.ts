import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultPaywallMilestoneStore } from "./default-paywall-milestone-store.js";
import { newDefaultPaywallMilestone } from "./default-paywall-milestone.js";

test("MemoryDefaultPaywallMilestoneStore finds what it saved", () => {
  const store = newMemoryDefaultPaywallMilestoneStore();
  const item = newDefaultPaywallMilestone("code-634", "name-239");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
