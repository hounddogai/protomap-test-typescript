import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedRewardRuleSummaryStore } from "./weighted-reward-rule-summary-store.js";
import { newWeightedRewardRuleSummary } from "./weighted-reward-rule-summary.js";

test("MemoryWeightedRewardRuleSummaryStore finds what it saved", () => {
  const store = newMemoryWeightedRewardRuleSummaryStore();
  const item = newWeightedRewardRuleSummary("code-722", "label-565");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
