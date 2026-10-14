import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPaywallMilestoneStore } from "./paywall-milestone-store.js";
import { newPaywallMilestone } from "./paywall-milestone.js";

test("MemoryPaywallMilestoneStore finds what it saved", () => {
  const store = newMemoryPaywallMilestoneStore();
  const item = newPaywallMilestone("code-939", "title-718");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
