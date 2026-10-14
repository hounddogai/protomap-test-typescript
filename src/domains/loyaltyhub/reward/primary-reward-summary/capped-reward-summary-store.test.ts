import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedRewardSummaryStore } from "./capped-reward-summary-store.js";
import { newCappedRewardSummary } from "./capped-reward-summary.js";

test("MemoryCappedRewardSummaryStore finds what it saved", () => {
  const store = newMemoryCappedRewardSummaryStore();
  const item = newCappedRewardSummary("code-246", "label-466");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
