import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedCreditMilestoneStore } from "./weighted-credit-milestone-store.js";
import { newWeightedCreditMilestone } from "./weighted-credit-milestone.js";

test("MemoryWeightedCreditMilestoneStore finds what it saved", () => {
  const store = newMemoryWeightedCreditMilestoneStore();
  const item = newWeightedCreditMilestone("code-548", "label-966");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
