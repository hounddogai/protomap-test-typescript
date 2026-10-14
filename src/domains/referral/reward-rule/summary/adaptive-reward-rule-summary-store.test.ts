import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveRewardRuleSummaryStore } from "./adaptive-reward-rule-summary-store.js";
import { newAdaptiveRewardRuleSummary } from "./adaptive-reward-rule-summary.js";

test("MemoryAdaptiveRewardRuleSummaryStore finds what it saved", () => {
  const store = newMemoryAdaptiveRewardRuleSummaryStore();
  const item = newAdaptiveRewardRuleSummary("code-786", "name-60");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
