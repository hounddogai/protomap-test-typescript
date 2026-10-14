import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingCreditMilestoneStore } from "./rolling-credit-milestone-store.js";
import { newRollingCreditMilestone } from "./rolling-credit-milestone.js";

test("MemoryRollingCreditMilestoneStore finds what it saved", () => {
  const store = newMemoryRollingCreditMilestoneStore();
  const item = newRollingCreditMilestone("code-848", "title-947");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
