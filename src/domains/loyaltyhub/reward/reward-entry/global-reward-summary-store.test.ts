import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalRewardSummaryStore } from "./global-reward-summary-store.js";
import { newGlobalRewardSummary } from "./global-reward-summary.js";

test("MemoryGlobalRewardSummaryStore finds what it saved", () => {
  const store = newMemoryGlobalRewardSummaryStore();
  const item = newGlobalRewardSummary("code-335", "title-407");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
