import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRewardSummaryStore } from "./reward-summary-store.js";
import { newRewardSummary } from "./reward-summary.js";

test("MemoryRewardSummaryStore finds what it saved", () => {
  const store = newMemoryRewardSummaryStore();
  const item = newRewardSummary("code-12", "name-705");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
